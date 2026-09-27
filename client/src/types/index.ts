export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastSeenAt?: string;
  createdAt?: string;
}

export interface Client {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone?: string;
  company?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    projects: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  projectManagerId: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  projectManager?: User;
  tasks?: Task[];
  activityLogs?: ActivityLog[];
  _count?: {
    tasks: number;
  };
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  developerId?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue?: boolean;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  developer?: User | null;
  activityLogs?: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  projectId: string;
  taskId?: string | null;
  actorId: string;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  message: string;
  createdAt: string;
  actor?: User;
  project?: { id: string; name: string };
  task?: { id: string; title: string; status?: string };
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  relatedProjectId?: string | null;
  relatedTaskId?: string | null;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export interface TaskQueryParams {
  status?: string;
  priority?: string;
  projectId?: string;
  developerId?: string;
  dueFrom?: string;
  dueTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}
