
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum Category {
  WORK = 'WORK',
  STUDY = 'STUDY',
  HEALTH = 'HEALTH',
  PERSONAL = 'PERSONAL',
  OTHER = 'OTHER'
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface User {
  email: string;
  name?: string;
  id: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  reminder?: string;
  priority: Priority;
  category: Category;
  completed: boolean;
  subtasks: Subtask[];
  createdAt: string;
  aiSuggested?: boolean;
}

export interface AIInsights {
  summary: string;
  tip: string;
  productivityScore: number;
}
