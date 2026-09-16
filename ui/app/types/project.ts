export type TaskStatus = 'Not Started' | 'In Progress' | 'Stalled' | 'Finished' | 'Delivered';
export type TaskOwner = 'Architect' | 'Client' | 'Both';
export type TaskVisibility = 'all' | 'architect-only';
export type CommentRole = 'Architect' | 'Client';

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author?: string;
  role: CommentRole;
}

/** @deprecated use Comment */
export interface TaskNote {
  id: string;
  text: string;
  createdAt: string;
  author?: string;
}

export interface Subtask {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completedAt?: string;
}

export interface Task {
  id: string;
  projectId: string;
  /** @deprecated use projectId */
  engagementId?: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt?: string;
  objectiveId?: string;
  milestoneId?: string;
  owner?: TaskOwner;
  visibility?: TaskVisibility;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  subtasks?: Subtask[];
  comments?: Comment[];
  /** @deprecated use comments */
  notes?: TaskNote[];
}

export interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  objectiveId?: string;
  milestoneId?: string;
  owner?: TaskOwner;
  visibility?: TaskVisibility;
  subtasks?: Subtask[];
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  description: string;
  createdAt: string;
  expectedDate?: string;
  tasks: Task[];
  objectives?: Objective[];
  milestones?: Milestone[];
  /** kept for storage back-compat */
  appId?: string;
  /** @deprecated no longer used for access control */
  assignedClientAppIds?: string[];
}
