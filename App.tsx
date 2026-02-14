
import React, { useState, useEffect, useCallback } from 'react';
import { Project, Vote, AppState, ViewMode } from './types';
import AdminView from './components/AdminView';
import AudienceView from './components/AudienceView';
import WinnersView from './components/WinnersView';
import { Settings, Trophy, Vote as VoteIcon, Lock, LogIn } from 'lucide-react';

const STORAGE_KEY = 'livevote_state';
const CHANNEL_NAME = 'livevote_sync';
const AUTH_KEY = 'livevote_admin_auth';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('HOME');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      projects: [],
      activeProjectId: null,
      votes: [],
      isWinnerAnnounced: false
    };
  });

  const [channel] = useState(() => new BroadcastChannel(CHANNEL_NAME));

  const syncState = useCallback((newState: AppState) => {
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    channel.postMessage(newState);
  }, [channel]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<AppState>) => {
      setState(event.data);
    };
    channel.onmessage = handleMessage;
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [channel]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'Kumar' && loginForm.password === 'voting123') {
      setIsLoggedIn(true);
      sessionStorage.setItem(AUTH_KEY, 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

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
    if (confirm("Are you sure you want to delete this project? All associated votes will also be removed.")) {
      const newProjects = state.projects.filter(p => p.id !== projectId);
      const newVotes = state.votes.filter(v => v.projectId !== projectId);
      const newActiveId = state.activeProjectId === projectId ? null : state.activeProjectId;
      
      syncState({
        ...state,
        projects: newProjects,
        votes: newVotes,
        activeProjectId: newActiveId
      });
    }
  };

  const runVoting = (projectId: string) => {
    syncState({ ...state, activeProjectId: projectId, isWinnerAnnounced: false });
  };

  const submitVote = (vote: Vote) => {
    syncState({ ...state, votes: [...state.votes, vote] });
  };

  const announceWinners = () => {
    syncState({ ...state, isWinnerAnnounced: true, activeProjectId: null });
    setView('WINNERS');
  };

  const resetAll = () => {
    if (confirm("Are you sure you want to reset everything? All projects and votes will be lost.")) {
      syncState({
        projects: [],
        activeProjectId: null,
        votes: [],
        isWinnerAnnounced: false
      });
      setView('HOME');
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem(AUTH_KEY);
    setView('HOME');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Header */}
      <header className="glass sticky top-0 z-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('HOME')}>
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Trophy size={20} />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            LiveVote
          </h1>
        </div>
        <nav className="flex items-center gap-4">
          <button 
            onClick={() => setView('ADMIN')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'ADMIN' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Settings size={16} /> Admin
          </button>
          <button 
            onClick={() => setView('VOTING')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'VOTING' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <VoteIcon size={16} /> Vote
          </button>
          {isLoggedIn && (
            <button onClick={logout} className="text-xs text-slate-400 hover:text-red-500 underline">Logout</button>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        {view === 'HOME' && (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-fadeIn">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Welcome to Presentation LiveVote</h2>
            <p className="text-lg text-slate-600 max-w-2xl mb-12">
              The ultimate platform for real-time audience engagement during presentations. 
              Rate products, creativity, and presentation skills seamlessly.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
              <button 
                onClick={() => setView('ADMIN')}
                className="group p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left"
              >
                <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Settings size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Organizer Dashboard</h3>
                <p className="text-slate-500">Add projects, manage voting sessions, and view real-time result statistics.</p>
              </button>
              <button 
                onClick={() => setView('VOTING')}
                className="group p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-300 transition-all text-left"
              >
                <div className="bg-violet-100 text-violet-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <VoteIcon size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Audience Portal</h3>
                <p className="text-slate-500">Join the live session and cast your votes for the current presentation.</p>
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
                <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Admin Access</h2>
                <p className="text-slate-500 mb-8 text-sm text-center">Please enter credentials to manage voting.</p>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Username</label>
                    <input
                      type="text"
                      placeholder="Username"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                  {loginError && <p className="text-red-500 text-sm font-medium text-center">{loginError}</p>}
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <LogIn size={20} /> Login
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

        {view === 'VOTING' && (
          <AudienceView 
            state={state} 
            submitVote={submitVote} 
          />
        )}

        {view === 'WINNERS' && (
          <WinnersView state={state} onBack={() => setView('ADMIN')} />
        )}
      </main>

      <footer className="py-8 border-t border-slate-200 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} LiveVote Systems. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
