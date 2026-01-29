
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Priority, Category, AIInsights, User } from './types';
import { TaskItem } from './components/TaskItem';
import { InsightsPanel } from './components/InsightsPanel';
import { Auth } from './components/Auth';
import { Logo } from './components/Logo';
import { parseNaturalLanguageTask, getProductivityInsights } from './services/geminiService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);

  // Auth initialization
  useEffect(() => {
    const savedUser = localStorage.getItem('lumina_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const savedTasks = localStorage.getItem('lumina_tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error("Failed to parse saved tasks", e);
      }
    }
  }, []);

  // Persistence
  useEffect(() => {
    if (user) {
      localStorage.setItem('lumina_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('lumina_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('lumina_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const addTask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    setIsParsing(true);
    const parsed = await parseNaturalLanguageTask(input);
    
    if (parsed) {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: parsed.title,
        deadline: parsed.deadline,
        reminder: parsed.reminder,
        priority: parsed.priority as Priority,
        category: parsed.category as Category,
        completed: false,
        subtasks: [],
        createdAt: new Date().toISOString(),
        aiSuggested: true
      };
      setTasks(prev => [newTask, ...prev]);
    } else {
      const fallback: Task = {
        id: crypto.randomUUID(),
        title: input,
        priority: Priority.MEDIUM,
        category: Category.PERSONAL,
        completed: false,
        subtasks: [],
        createdAt: new Date().toISOString()
      };
      setTasks(prev => [fallback, ...prev]);
    }
    
    setInput('');
    setIsParsing(false);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleSetReminder = (taskId: string, reminder: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, reminder } : t
    ));
  };

  const updateSubtasks = (taskId: string, subtaskTitles: string[]) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newSubtasks = subtaskTitles.map(title => ({
          id: crypto.randomUUID(),
          title,
          completed: false
        }));
        return { ...t, subtasks: [...t.subtasks, ...newSubtasks] };
      }
      return t;
    }));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map(s => 
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          )
        };
      }
      return t;
    }));
  };

  const fetchInsights = async () => {
    if (tasks.length === 0) return;
    setIsInsightsLoading(true);
    const data = await getProductivityInsights(tasks);
    if (data) setInsights(data);
    setIsInsightsLoading(false);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesCategory = filterCategory === 'ALL' || t.category === filterCategory;
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const priorityWeight = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }, [tasks, filterCategory, searchTerm]);

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto pb-32 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Logo size="md" />
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
              Lumina Tasks
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Hello, {user.name || 'User'}</span>
              <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
              <button 
                onClick={handleLogout}
                className="text-slate-500 hover:text-rose-400 text-xs transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative">
             <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
             <input 
               type="text" 
               placeholder="Search tasks..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full md:w-64"
             />
           </div>
        </div>
      </header>

      <InsightsPanel 
        insights={insights} 
        loading={isInsightsLoading} 
        onRefresh={fetchInsights}
        completedCount={tasks.filter(t => t.completed).length}
        totalCount={tasks.length}
      />

      <div className="mb-8">
        <form onSubmit={addTask} className="relative group">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isParsing}
            placeholder='Try: "Draft marketing email by 3pm high priority"'
            className="w-full glass rounded-2xl px-6 py-5 pr-16 text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all border-slate-700/50"
          />
          <button 
            type="submit"
            disabled={!input || isParsing}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
          >
            {isParsing ? (
              <i className="fas fa-spinner animate-spin"></i>
            ) : (
              <i className="fas fa-sparkles"></i>
            )}
          </button>
        </form>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {['ALL', ...Object.values(Category)].map(cat => (
          <button 
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              filterCategory === cat 
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4 mb-20">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onToggle={toggleTask}
              onDelete={deleteTask}
              onUpdateSubtasks={updateSubtasks}
              onToggleSubtask={toggleSubtask}
              onSetReminder={handleSetReminder}
            />
          ))
        ) : (
          <div className="text-center py-20 glass rounded-3xl border-dashed border-2 border-slate-800">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-clipboard-list text-2xl text-slate-600"></i>
            </div>
            <h3 className="text-slate-300 font-medium mb-1">No tasks found</h3>
            <p className="text-slate-500 text-sm">Add a task above to get started</p>
          </div>
        )}
      </div>

      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 glass rounded-full flex items-center gap-8 shadow-2xl border border-white/10 z-50">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total</span>
          <span className="text-lg font-bold text-slate-200">{tasks.length}</span>
        </div>
        <div className="w-px h-8 bg-slate-700"></div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-1">Done</span>
          <span className="text-lg font-bold text-emerald-400">{tasks.filter(t => t.completed).length}</span>
        </div>
        <div className="w-px h-8 bg-slate-700"></div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mb-1">Pending</span>
          <span className="text-lg font-bold text-rose-400">{tasks.filter(t => !t.completed).length}</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
