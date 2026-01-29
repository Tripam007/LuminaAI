
import React, { useState } from 'react';
import { Task, Priority, Category } from '../types';
import { generateSubtasks, suggestReminderTime } from '../services/geminiService';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateSubtasks: (taskId: string, subtasks: string[]) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onSetReminder: (taskId: string, reminder: string) => void;
}

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const colors = {
    [Priority.LOW]: 'bg-slate-700 text-slate-300',
    [Priority.MEDIUM]: 'bg-blue-900 text-blue-200',
    [Priority.HIGH]: 'bg-rose-900 text-rose-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[priority]}`}>
      {priority}
    </span>
  );
};

const CategoryIcon: React.FC<{ category: Category }> = ({ category }) => {
  const icons = {
    [Category.WORK]: 'fa-briefcase',
    [Category.STUDY]: 'fa-book',
    [Category.HEALTH]: 'fa-heartbeat',
    [Category.PERSONAL]: 'fa-user',
    [Category.OTHER]: 'fa-tag',
  };
  return <i className={`fas ${icons[category]} text-slate-400 mr-2`}></i>;
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onUpdateSubtasks, onToggleSubtask, onSetReminder }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggestingReminder, setIsSuggestingReminder] = useState(false);
  const [reminderSuggestion, setReminderSuggestion] = useState<string | null>(null);
  const [showSubtasks, setShowSubtasks] = useState(true);

  const handleSmartBreakdown = async () => {
    setIsGenerating(true);
    const subtaskTitles = await generateSubtasks(task.title);
    onUpdateSubtasks(task.id, subtaskTitles);
    setIsGenerating(false);
  };

  const handleSuggestReminder = async () => {
    setIsSuggestingReminder(true);
    const result = await suggestReminderTime(task);
    if (result) {
      setReminderSuggestion(result.suggestion);
    }
    setIsSuggestingReminder(false);
  };

  const handleApplyReminder = () => {
    if (reminderSuggestion) {
      onSetReminder(task.id, reminderSuggestion);
      setReminderSuggestion(null);
    }
  };

  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadlineDate && deadlineDate < new Date() && !task.completed;

  return (
    <div className={`task-card glass rounded-xl p-4 mb-3 transition-all duration-200 group ${task.completed ? 'opacity-60' : 'hover:scale-[1.01]'}`}>
      <div className="flex items-start gap-4">
        <button 
          onClick={() => onToggle(task.id)}
          className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
            task.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 hover:border-indigo-400'
          }`}
        >
          {task.completed && <i className="fas fa-check text-[10px] text-white"></i>}
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <CategoryIcon category={task.category} />
              <h3 className={`font-semibold text-slate-100 ${task.completed ? 'line-through' : ''}`}>
                {task.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={handleSuggestReminder}
                className="text-slate-400 hover:text-emerald-400 p-1 rounded-md hover:bg-slate-800"
                title="Suggest Smart Reminder"
              >
                <i className={`fas fa-bell ${isSuggestingReminder ? 'animate-bounce' : ''}`}></i>
              </button>
              <button 
                onClick={handleSmartBreakdown}
                disabled={isGenerating}
                className="text-slate-400 hover:text-indigo-400 p-1 rounded-md hover:bg-slate-800"
                title="AI Breakdown"
              >
                <i className={`fas fa-wand-magic-sparkles ${isGenerating ? 'animate-pulse' : ''}`}></i>
              </button>
              <button 
                onClick={() => onDelete(task.id)}
                className="text-slate-400 hover:text-rose-400 p-1 rounded-md hover:bg-slate-800"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-3">
            <PriorityBadge priority={task.priority} />
            {deadlineDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400' : ''}`}>
                <i className="far fa-calendar"></i>
                {deadlineDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {task.reminder && (
               <span className="flex items-center gap-1 text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                 <i className="fas fa-bell"></i>
                 {task.reminder}
               </span>
            )}
            {task.subtasks.length > 0 && (
               <span 
                className="cursor-pointer hover:text-slate-200"
                onClick={() => setShowSubtasks(!showSubtasks)}
               >
                <i className={`fas fa-chevron-${showSubtasks ? 'down' : 'right'} mr-1`}></i>
                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
              </span>
            )}
          </div>

          {reminderSuggestion && (
            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-2 mb-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <i className="fas fa-sparkles text-indigo-400 text-[10px]"></i>
                <span className="text-xs text-indigo-200">AI Suggests: <strong>{reminderSuggestion}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                 <button 
                   onClick={handleApplyReminder}
                   className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded font-bold uppercase tracking-wider"
                 >
                   Apply
                 </button>
                 <button 
                   onClick={() => setReminderSuggestion(null)}
                   className="text-[10px] text-slate-400 hover:text-slate-200"
                 >
                   Dismiss
                 </button>
              </div>
            </div>
          )}

          {showSubtasks && task.subtasks.length > 0 && (
            <div className="space-y-2 mt-2 ml-2 border-l border-slate-700 pl-4">
              {task.subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 group/sub">
                  <button 
                    onClick={() => onToggleSubtask(task.id, sub.id)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      sub.completed ? 'bg-slate-600 border-slate-600' : 'border-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {sub.completed && <i className="fas fa-check text-[8px] text-white"></i>}
                  </button>
                  <span className={`text-sm ${sub.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
