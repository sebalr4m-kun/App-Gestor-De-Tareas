import type { CreateTaskInput, Task, TaskFilters, TaskStatus } from '../types/task';

const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
).replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const STATUS_TO_API: Record<TaskStatus, string> = {
  todas: 'all',
  pendientes: 'pending',
  completadas: 'completed',
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const rawText = await response.text();
  let parsed: unknown = null;

  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }
  }

  if (!response.ok) {
    const serverMessage =
      typeof parsed === 'object' && parsed !== null && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : typeof parsed === 'string' && parsed.trim()
          ? parsed.trim()
          : `Error HTTP ${response.status}`;
    throw new ApiError(response.status, serverMessage);
  }

  return parsed as T;
}

export const tasksService = {
  async list(filters: TaskFilters = {}, signal?: AbortSignal): Promise<Task[]> {
    const params = new URLSearchParams();
    const search = filters.search?.trim();
    if (search) {
      params.set('search', search);
    }
    if (filters.status) {
      params.set('status', STATUS_TO_API[filters.status]);
    }
    const queryString = params.toString();
    const path = queryString ? `/tasks?${queryString}` : '/tasks';
    const data = await request<Task[]>(path, { method: 'GET', signal });
    return Array.isArray(data) ? data : [];
  },

  async get(id: number, signal?: AbortSignal): Promise<Task> {
    return request<Task>(`/tasks/${id}`, { method: 'GET', signal });
  },

  async create(input: CreateTaskInput): Promise<Task> {
    return request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async setCompleted(id: number, completed: boolean): Promise<Task> {
    return request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    });
  },

  async remove(id: number): Promise<void> {
    await request<void>(`/tasks/${id}`, { method: 'DELETE' });
  },
};
