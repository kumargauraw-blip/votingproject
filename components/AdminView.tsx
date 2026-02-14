
import React, { useState } from 'react';
import { AppState, Project } from '../types';
import { Plus, Play, CheckCircle, Trophy, Trash2, Users } from 'lucide-react';

interface AdminViewProps {
  state: AppState;
  addProject: (presenter: string, project: string) => void;
  runVoting: (id: string) => void;
  announceWinners: () => void;
  resetAll: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ state, addProject, runVoting, announceWinners, resetAll }) => {
  const [presenterName, setPresenterName] = useState('');
  const [projectName, setProjectName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (presenterName && projectName) {
      addProject(presenterName, projectName);
      setPresenterName('');
      setProjectName('');
    }
  };

  const getVoteCount = (projectId: string) => {
    return state.votes.filter(v => v.projectId === projectId).length;
  };

  const getAverageScore = (projectId: string) => {
    const projectVotes = state.votes.filter(v => v.projectId === projectId);
    if (projectVotes.length === 0) return 0;
    const total = projectVotes.reduce((sum, v) => sum + v.totalScore, 0);
    return (total / projectVotes.length).toFixed(1);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Add Project Form */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Plus className="text-indigo-600" size={24} /> Add New Presentation
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Presenter Name"
            value={presenterName}
            onChange={(e) => setPresenterName(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            required
          />
          <input
            type="text"
            placeholder="Project Title"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Add to Queue
          </button>
        </form>
      </section>

      {/* Control Panel */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-indigo-900 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <h3 className="text-lg font-bold">Event Control Panel</h3>
          <p className="text-indigo-200 text-sm">Manage the active voting state and finalize results.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={announceWinners}
            className="flex items-center gap-2 bg-yellow-400 text-indigo-950 px-5 py-2.5 rounded-xl font-bold hover:bg-yellow-300 transition-all shadow-md active:scale-95"
          >
            <Trophy size={18} /> Announce Winner
          </button>
          <button
            onClick={resetAll}
            className="flex items-center gap-2 bg-red-500/20 text-red-100 border border-red-500/30 px-5 py-2.5 rounded-xl font-semibold hover:bg-red-500/40 transition-all"
          >
            <Trash2 size={18} /> Reset All
          </button>
        </div>
      </div>

      {/* Project List */}
      <div className="grid gap-4">
        <h3 className="text-lg font-bold text-slate-700">Project List ({state.projects.length})</h3>
        {state.projects.length === 0 ? (
          <div className="text-center py-12 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
            No projects added yet. Start by adding one above.
          </div>
        ) : (
          state.projects.map((project) => {
            const isActive = state.activeProjectId === project.id;
            const voteCount = getVoteCount(project.id);
            const avgScore = getAverageScore(project.id);
            
            return (
              <div 
                key={project.id} 
                className={`bg-white p-5 rounded-2xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${isActive ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20' : 'border-slate-200'}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-bold text-slate-900">{project.projectName}</h4>
                    {isActive && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active Voting</span>}
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Presenter: {project.presenterName}</p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-4 text-slate-600">
                    <div className="flex flex-col items-center">
                      <span className="text-xs uppercase text-slate-400 font-bold">Votes</span>
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <Users size={14} /> {voteCount}
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs uppercase text-slate-400 font-bold">Avg Score</span>
                      <div className="font-bold text-indigo-600 text-lg">{avgScore}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => runVoting(project.id)}
                    disabled={isActive}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-all ${isActive ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'}`}
                  >
                    {isActive ? <CheckCircle size={18} /> : <Play size={18} />}
                    {isActive ? 'Voting In Progress' : 'Run Voting'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminView;
