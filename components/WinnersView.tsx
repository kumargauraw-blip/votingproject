
import React, { useEffect, useState } from 'react';
import { AppState, Project } from '../types';
import { Trophy, Medal, Crown, ArrowLeft, Star } from 'lucide-react';

interface WinnersViewProps {
  state: AppState;
  onBack: () => void;
}

interface RankedProject extends Project {
  totalScore: number;
  voteCount: number;
  averageScore: number;
}

const WinnersView: React.FC<WinnersViewProps> = ({ state, onBack }) => {
  const [winners, setWinners] = useState<RankedProject[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const ranked = state.projects.map(p => {
      const votes = state.votes.filter(v => v.projectId === p.id);
      const totalScore = votes.reduce((sum, v) => sum + v.totalScore, 0);
      const voteCount = votes.length;
      return {
        ...p,
        totalScore,
        voteCount,
        averageScore: voteCount > 0 ? totalScore / voteCount : 0
      };
    });

    // Sort by average score descending
    const sorted = ranked.sort((a, b) => b.averageScore - a.averageScore).slice(0, 3);
    setWinners(sorted);
    
    setTimeout(() => setShowCelebration(true), 300);
  }, [state.projects, state.votes]);

  return (
    <div className="flex flex-col items-center animate-fadeIn py-10">
      <div className="w-full flex justify-start mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
      </div>

      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 bg-clip-text text-transparent bg-gradient-to-b from-indigo-900 to-indigo-600">
          The Winners
        </h2>
        <p className="text-slate-500 text-lg">Congratulations to the top performers of today's presentations!</p>
      </div>

      {winners.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 w-full max-w-2xl px-10">
          <p className="text-slate-400 italic">No votes have been cast yet. Complete the voting process to see winners.</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-end justify-center gap-6 md:gap-4 w-full max-w-5xl">
          
          {/* 2nd Place */}
          {winners[1] && (
            <div className={`order-2 md:order-1 flex flex-col items-center w-full md:w-64 transform transition-all duration-1000 delay-300 ${showCelebration ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
              <div className="bg-slate-200 text-slate-700 p-4 rounded-2xl shadow-lg border-2 border-white mb-6 flex flex-col items-center w-full">
                <Medal size={48} className="text-slate-400 mb-2" />
                <h4 className="font-bold text-center leading-tight truncate w-full">{winners[1].projectName}</h4>
                <p className="text-xs text-slate-500 truncate w-full text-center">{winners[1].presenterName}</p>
                <div className="mt-4 bg-white/50 px-3 py-1 rounded-full font-black text-slate-700">
                  {winners[1].averageScore.toFixed(1)} <span className="text-[10px] font-normal">AVG</span>
                </div>
              </div>
              <div className="bg-slate-300 w-full h-32 rounded-t-3xl flex items-center justify-center">
                <span className="text-5xl font-black text-slate-400">2nd</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {winners[0] && (
            <div className={`order-1 md:order-2 flex flex-col items-center w-full md:w-80 z-10 transform transition-all duration-1000 ${showCelebration ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
              <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-950 p-6 rounded-3xl shadow-2xl border-4 border-yellow-200 mb-8 flex flex-col items-center w-full">
                <div className="absolute -top-12 animate-bounce">
                  <Crown size={64} className="text-yellow-400 drop-shadow-lg" />
                </div>
                <h3 className="text-xl font-black text-center leading-tight mb-1 truncate w-full">{winners[0].projectName}</h3>
                <p className="text-sm font-bold opacity-75 truncate w-full text-center">{winners[0].presenterName}</p>
                <div className="mt-6 bg-yellow-950 text-yellow-300 px-6 py-2 rounded-2xl font-black text-xl shadow-inner">
                  {winners[0].averageScore.toFixed(1)} <span className="text-xs font-normal">AVG</span>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
              </div>
              <div className="bg-indigo-600 w-full h-48 rounded-t-3xl flex items-center justify-center shadow-lg">
                <span className="text-7xl font-black text-white">1st</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {winners[2] && (
            <div className={`order-3 md:order-3 flex flex-col items-center w-full md:w-64 transform transition-all duration-1000 delay-500 ${showCelebration ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
              <div className="bg-amber-100 text-amber-900 p-4 rounded-2xl shadow-lg border-2 border-white mb-6 flex flex-col items-center w-full">
                <Medal size={48} className="text-amber-600 mb-2" />
                <h4 className="font-bold text-center leading-tight truncate w-full">{winners[2].projectName}</h4>
                <p className="text-xs text-amber-800/60 truncate w-full text-center">{winners[2].presenterName}</p>
                <div className="mt-4 bg-white/50 px-3 py-1 rounded-full font-black text-amber-900">
                  {winners[2].averageScore.toFixed(1)} <span className="text-[10px] font-normal">AVG</span>
                </div>
              </div>
              <div className="bg-amber-200 w-full h-24 rounded-t-3xl flex items-center justify-center">
                <span className="text-4xl font-black text-amber-600">3rd</span>
              </div>
            </div>
          )}
        </div>
      )}

      {winners.length > 0 && (
        <div className="mt-20 w-full max-w-3xl space-y-4 animate-fadeIn delay-1000">
          <h4 className="text-slate-400 font-bold uppercase tracking-widest text-sm text-center">Score Breakdown</h4>
          {winners.map((winner, idx) => (
            <div key={winner.id} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                  {idx + 1}
                </span>
                <div>
                  <p className="font-bold text-slate-900">{winner.projectName}</p>
                  <p className="text-xs text-slate-500">{winner.presenterName} • {winner.voteCount} total votes</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-indigo-600 text-lg">{winner.averageScore.toFixed(1)}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Avg Points</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WinnersView;
