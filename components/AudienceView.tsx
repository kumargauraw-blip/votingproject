
import React, { useState, useEffect } from 'react';
import { AppState, Vote, Project } from '../types';
import { User, Send, Star, Layers, Zap } from 'lucide-react';

interface AudienceViewProps {
  state: AppState;
  submitVote: (vote: Vote) => void;
}

const AudienceView: React.FC<AudienceViewProps> = ({ state, submitVote }) => {
  const [voterName, setVoterName] = useState('');
  const [isVoterRegistered, setIsVoterRegistered] = useState(false);
  const [presentationScore, setPresentationScore] = useState(15);
  const [productScore, setProductScore] = useState(22);
  const [creativityScore, setCreativityScore] = useState(12);
  const [hasVotedForCurrent, setHasVotedForCurrent] = useState(false);

  const activeProject = state.projects.find(p => p.id === state.activeProjectId);

  // Check if user already voted for the active project
  useEffect(() => {
    if (isVoterRegistered && activeProject) {
      const alreadyVoted = state.votes.some(v => v.voterName === voterName && v.projectId === activeProject.id);
      setHasVotedForCurrent(alreadyVoted);
    } else {
      setHasVotedForCurrent(false);
    }
  }, [activeProject, isVoterRegistered, voterName, state.votes]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (voterName.trim()) {
      setIsVoterRegistered(true);
    }
  };

  const handleVoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || hasVotedForCurrent) return;

    const totalScore = presentationScore + productScore + creativityScore;
    const newVote: Vote = {
      voterName,
      projectId: activeProject.id,
      presentationScore,
      productScore,
      creativityScore,
      totalScore,
      timestamp: Date.now()
    };

    submitVote(newVote);
    setHasVotedForCurrent(true);
  };

  if (!isVoterRegistered) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fadeIn">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 w-full max-w-md text-center">
          <div className="bg-indigo-100 text-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <User size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Identify Yourself</h2>
          <p className="text-slate-500 mb-8 text-sm">Enter your name to start voting on presentations.</p>
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text"
              placeholder="Your Full Name"
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-center text-lg font-medium"
              required
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
            >
              Start Voting
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
        <div className="bg-slate-100 p-8 rounded-full mb-6">
          <Zap size={48} className="text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Active Voting Session</h2>
        <p className="text-slate-500">Wait for the organizer to start the next presentation's voting session.</p>
        <p className="mt-8 text-xs font-bold text-indigo-600 uppercase tracking-widest">Connected as {voterName}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fadeIn">
      <div className="bg-white overflow-hidden rounded-3xl shadow-xl border border-slate-200">
        <div className="bg-indigo-600 px-8 py-10 text-white text-center">
          <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2">Now Rating</p>
          <h2 className="text-3xl font-extrabold mb-1">{activeProject.projectName}</h2>
          <p className="text-indigo-200 font-medium">by {activeProject.presenterName}</p>
        </div>

        {hasVotedForCurrent ? (
          <div className="p-12 text-center">
            <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Vote Submitted!</h3>
            <p className="text-slate-500">Thank you for your feedback, {voterName}. We've recorded your rating for this presentation.</p>
          </div>
        ) : (
          <form onSubmit={handleVoteSubmit} className="p-8 space-y-10">
            {/* Question 1 */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-slate-700 font-bold flex items-center gap-2">
                  <Star className="text-yellow-500" size={20} /> Presentation Style
                </label>
                <span className="text-2xl font-black text-indigo-600">{presentationScore}<span className="text-sm text-slate-400 font-normal">/30</span></span>
              </div>
              <p className="text-xs text-slate-400">Rate the flow, clarity, and engagement level (0-30).</p>
              <input
                type="range"
                min="0"
                max="30"
                value={presentationScore}
                onChange={(e) => setPresentationScore(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Question 2 */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-slate-700 font-bold flex items-center gap-2">
                  <Layers className="text-blue-500" size={20} /> Product Quality
                </label>
                <span className="text-2xl font-black text-indigo-600">{productScore}<span className="text-sm text-slate-400 font-normal">/45</span></span>
              </div>
              <p className="text-xs text-slate-400">Rate the actual product utility and implementation (0-45).</p>
              <input
                type="range"
                min="0"
                max="45"
                value={productScore}
                onChange={(e) => setProductScore(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Question 3 */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-slate-700 font-bold flex items-center gap-2">
                  <Zap className="text-purple-500" size={20} /> AI & Creativity
                </label>
                <span className="text-2xl font-black text-indigo-600">{creativityScore}<span className="text-sm text-slate-400 font-normal">/25</span></span>
              </div>
              <p className="text-xs text-slate-400">Value of creativity and AI use (0-25).</p>
              <input
                type="range"
                min="0"
                max="25"
                value={creativityScore}
                onChange={(e) => setCreativityScore(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-center px-4 py-3 bg-indigo-50 rounded-2xl">
                <span className="font-bold text-indigo-900">Total Points Given</span>
                <span className="text-3xl font-black text-indigo-600">{presentationScore + productScore + creativityScore}</span>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Send size={20} /> Submit My Rating
              </button>
            </div>
          </form>
        )}
      </div>
      
      <div className="flex justify-center items-center gap-2 text-slate-400 text-sm">
        <User size={14} /> Connected as <strong>{voterName}</strong>
      </div>
    </div>
  );
};

const CheckCircle: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

export default AudienceView;
