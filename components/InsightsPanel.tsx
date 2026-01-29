
import React from 'react';
import { AIInsights } from '../types';

interface InsightsPanelProps {
  insights: AIInsights | null;
  loading: boolean;
  onRefresh: () => void;
  completedCount: number;
  totalCount: number;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, loading, onRefresh, completedCount, totalCount }) => {
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="glass rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <i className="fas fa-chart-line text-indigo-400"></i>
          Performance
        </h2>
        <button 
          onClick={onRefresh}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <i className={`fas fa-sync-alt mr-1 ${loading ? 'animate-spin' : ''}`}></i>
          Update Stats
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <span className="text-slate-400 text-sm">Task Completion</span>
            <span className="text-2xl font-bold text-indigo-400">{progress}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex gap-4 text-xs text-slate-400">
            <span>{completedCount} Completed</span>
            <span>{totalCount - completedCount} Pending</span>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="flex items-start gap-3">
            <div className="mt-1 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <i className="fas fa-brain"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200 mb-1">AI Daily Tip</p>
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 bg-slate-700 rounded w-full"></div>
                  <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  "{insights?.tip || 'Add more tasks to get personalized productivity coaching.'}"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
