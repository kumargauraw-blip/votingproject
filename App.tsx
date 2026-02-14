
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, Vote, AppState, ViewMode } from './types';
import AdminView from './components/AdminView';
import AudienceView from './components/AudienceView';
import WinnersView from './components/WinnersView';
import { Settings, Trophy, Vote as VoteIcon, Lock, LogIn, Globe, Copy, Check, Hash, ArrowRight } from 'lucide-react';
import mqtt from 'mqtt';

const STORAGE_KEY = 'livevote_state';
const ROOM_ID_KEY = 'livevote_room_id';
const AUTH_KEY = 'livevote_admin_auth';

// Public MQTT broker for real-time sync (No account required)
const MQTT_BROKER = 'wss://broker.emqx.io:8084/mqtt';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('room') ? 'VOTING' : 'HOME';
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  });

  const [roomId, setRoomId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom) return urlRoom.toUpperCase();
    
    const saved = localStorage.getItem(ROOM_ID_KEY);
    if (saved) return saved;
    
    const newId = Math.random().toString(36).substr(2, 6).toUpperCase();
    localStorage.setItem(ROOM_ID_KEY, newId);
    return newId;
  });

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      projects: [],
      activeProjectId: null,
      votes: [],
      isWinnerAnnounced: false
    };
  });

  const [isConnected, setIsConnected] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const mqttClientRef = useRef<mqtt.MqttClient | null>(null);

  // Sync state to local and remote
  const syncState = useCallback((newState: AppState, isRemoteUpdate = false) => {
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    
    if (!isRemoteUpdate && mqttClientRef.current?.connected) {
      const topic = `livevote/${roomId}/state`;
      mqttClientRef.current.publish(topic, JSON.stringify(newState), { retain: true, qos: 1 });
    }
  }, [roomId]);

  const handleRemoteVote = useCallback((vote: Vote) => {
    setState(prev => {
      const exists = prev.votes.some(v => v.voterName === vote.voterName && v.projectId === vote.projectId);
      if (exists) return prev;
      const newState = { ...prev, votes: [...prev.votes, vote] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  useEffect(() => {
    const client = mqtt.connect(MQTT_BROKER);
    mqttClientRef.current = client;

    client.on('connect', () => {
      setIsConnected(true);
      client.subscribe(`livevote/${roomId}/state`);
      client.subscribe(`livevote/${roomId}/votes`);
      client.subscribe(`livevote/${roomId}/sync_request`);
      
      // If we are a participant joining, ask for the current state
      if (!isLoggedIn) {
        client.publish(`livevote/${roomId}/sync_request`, JSON.stringify({ type: 'PING' }));
      }
    });

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        if (topic === `livevote/${roomId}/state`) {
          if (!isLoggedIn) {
            setState(data);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          }
        } else if (topic === `livevote/${roomId}/votes`) {
          if (isLoggedIn) {
            handleRemoteVote(data);
          }
        } else if (topic === `livevote/${roomId}/sync_request`) {
          // If admin receives a sync request, broadcast state so new person sees it
          if (isLoggedIn) {
            const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            client.publish(`livevote/${roomId}/state`, JSON.stringify(current), { retain: true, qos: 1 });
          }
        }
      } catch (e) {
        console.error("MQTT Error", e);
      }
    });

    client.on('close', () => setIsConnected(false));

    return () => {
      client.end();
    };
  }, [roomId, isLoggedIn, handleRemoteVote]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.length >= 4) {
      const newRoom = joinCode.toUpperCase();
      setRoomId(newRoom);
      localStorage.setItem(ROOM_ID_KEY, newRoom);
      // Update URL without refreshing
      const newUrl = `${window.location.origin}${window.location.pathname}?room=${newRoom}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      setView('VOTING');
      setJoinCode('');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'Kumar' && loginForm.password === 'voting123') {
      setIsLoggedIn(true);
      sessionStorage.setItem(AUTH_KEY, 'true');
      setLoginError('');
      syncState(state);
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const addProject = (presenterName: string, projectName: string) => {
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      presenterName,
      projectName,
      createdAt: Date.now(),
    };
    syncState({ ...state, projects: [...state.projects, newProject] });
  };

  const deleteProject = (projectId: string) => {
    if (confirm("Delete this project?")) {
      const newProjects = state.projects.filter(p => p.id !== projectId);
      const newVotes = state.votes.filter(v => v.projectId !== projectId);
      const newActiveId = state.activeProjectId === projectId ? null : state.activeProjectId;
      syncState({ ...state, projects: newProjects, votes: newVotes, activeProjectId: newActiveId });
    }
  };

  const runVoting = (projectId: string) => {
    syncState({ ...state, activeProjectId: projectId, isWinnerAnnounced: false });
  };

  const submitVote = (vote: Vote) => {
    if (mqttClientRef.current?.connected) {
      mqttClientRef.current.publish(`livevote/${roomId}/votes`, JSON.stringify(vote), { qos: 1 });
    }
    const newState = { ...state, votes: [...state.votes, vote] };
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  const announceWinners = () => {
    syncState({ ...state, isWinnerAnnounced: true, activeProjectId: null });
    setView('WINNERS');
  };

  const resetAll = () => {
    if (confirm("Reset everything?")) {
      const cleared = { projects: [], activeProjectId: null, votes: [], isWinnerAnnounced: false };
      syncState(cleared);
      setView('HOME');
    }
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="glass sticky top-0 z-50 border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('HOME')}>
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Trophy size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 leading-none">
              LiveVote
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {isConnected ? `Room ${roomId}` : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={() => setView('ADMIN')}
            className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'ADMIN' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Settings size={16} /> <span className="hidden sm:inline">Admin</span>
          </button>
          <button 
            onClick={() => setView('VOTING')}
            className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'VOTING' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <VoteIcon size={16} /> <span className="hidden sm:inline">Vote</span>
          </button>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6">
        {isLoggedIn && view === 'ADMIN' && (
          <div className="mb-6 bg-white border border-indigo-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                <Globe size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Audience Link</p>
                <p className="text-sm font-medium text-slate-700">Invite Code: <span className="font-bold text-indigo-600">{roomId}</span></p>
              </div>
            </div>
            <button 
              onClick={copyInviteLink}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
            >
              {copySuccess ? <Check size={16} /> : <Copy size={16} />}
              {copySuccess ? 'Copied URL!' : 'Copy Invite Link'}
            </button>
          </div>
        )}

        {view === 'HOME' && (
          <div className="flex flex-col items-center justify-center py-8 md:py-16 text-center animate-fadeIn">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 px-4 leading-tight">
              Presentation <span className="text-indigo-600">Live Rating</span>
            </h2>
            
            <div className="w-full max-w-md bg-white p-6 rounded-3xl shadow-xl border border-slate-200 mb-12">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Join an Existing Session</h3>
              <form onSubmit={handleJoinRoom} className="flex flex-col gap-3">
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    type="text" 
                    placeholder="Enter Room Code (e.g. AB12CD)" 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none font-bold text-lg tracking-widest"
                  />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                  Join Room <ArrowRight size={18} />
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl px-4">
              <button 
                onClick={() => setView('ADMIN')}
                className="group p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left"
              >
                <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Settings size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Host Dashboard</h3>
                <p className="text-slate-500 text-sm">Create projects and manage the live voting flow.</p>
              </button>
              <button 
                onClick={() => setView('VOTING')}
                className="group p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-300 transition-all text-left"
              >
                <div className="bg-violet-50 text-violet-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-600 group-hover:text-white transition-all">
                  <VoteIcon size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Audience Portal</h3>
                <p className="text-slate-500 text-sm">Join the room automatically and cast your votes.</p>
              </button>
            </div>
          </div>
        )}

        {view === 'ADMIN' && (
          !isLoggedIn ? (
            <div className="flex flex-col items-center justify-center py-12 animate-fadeIn">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 w-full max-w-md">
                <div className="bg-indigo-100 text-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Lock size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Organizer Login</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Username"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                  {loginError && <p className="text-red-500 text-sm text-center font-medium">{loginError}</p>}
                  <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    Access Dashboard
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <AdminView 
              state={state} 
              addProject={addProject} 
              deleteProject={deleteProject}
              runVoting={runVoting} 
              announceWinners={announceWinners} 
              resetAll={resetAll}
            />
          )
        )}

        {view === 'VOTING' && <AudienceView state={state} submitVote={submitVote} />}
        {view === 'WINNERS' && <WinnersView state={state} onBack={() => setView('ADMIN')} />}
      </main>

      <footer className="py-8 border-t border-slate-200 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} LiveVote Cloud • Room: <span className="font-bold">{roomId}</span>
      </footer>
    </div>
  );
};

export default App;
