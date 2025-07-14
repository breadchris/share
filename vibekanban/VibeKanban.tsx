import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Types
interface Project {
  id: string;
  name: string;
  git_repo_path: string;
  setup_script?: string;
  dev_script?: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inprogress' | 'inreview' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  project_id: string;
  user_id: string;
  labels?: string[];
  created_at: string;
  updated_at: string;
  attempts?: TaskAttempt[];
}

interface TaskAttempt {
  id: string;
  task_id: string;
  executor: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  worktree_path?: string;
  branch?: string;
  base_branch: string;
  pr_url?: string;
  start_time?: string;
  end_time?: string;
  git_diff?: string;
}

interface ExecutionProcess {
  id: string;
  attempt_id: string;
  type: 'setupscript' | 'codingagent' | 'devserver';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'killed';
  command: string;
  process_id?: number;
  start_time?: string;
  end_time?: string;
  stdout?: string;
  stderr?: string;
  exit_code?: number;
  port?: number;
  url?: string;
}

// Drag and drop types
const ItemTypes = {
  TASK: 'task'
};

interface DragItem {
  id: string;
  index: number;
  sourceColumnId: string;
}

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
  { id: 'inprogress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'inreview', title: 'In Review', color: 'bg-yellow-100' },
  { id: 'done', title: 'Done', color: 'bg-green-100' },
];

const NewTaskDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
  projectId: string;
}> = ({ isOpen, onClose, onTaskCreated, projectId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    labels: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: 'todo' as Task['status'],
        labels: formData.labels.trim() ? formData.labels.split(',').map(l => l.trim()).filter(l => l) : [],
      };

      const response = await fetch(`/vibekanban/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      const task = await response.json();
      onTaskCreated(task);
      onClose();
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        labels: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the task in detail..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Labels
            </label>
            <input
              type="text"
              value={formData.labels}
              onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="feature, bug, urgent (comma-separated)"
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple labels with commas</p>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TaskCard: React.FC<{
  task: Task;
  onTaskClick: (task: Task) => void;
  onStartTask: (task: Task) => void;
  isDragging?: boolean;
}> = ({ task, onTaskClick, onStartTask, isDragging = false }) => {
  const priorityColors = {
    low: 'border-l-green-500',
    medium: 'border-l-yellow-500',
    high: 'border-l-red-500',
  };

  const statusColors = {
    todo: 'text-gray-600',
    inprogress: 'text-blue-600',
    inreview: 'text-yellow-600',
    done: 'text-green-600',
    cancelled: 'text-red-600',
  };

  const latestAttempt = task.attempts?.[0];
  const hasRunningAttempt = latestAttempt?.status === 'running';

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-l-4 ${priorityColors[task.priority]} p-4 cursor-pointer hover:shadow-md transition-shadow ${isDragging ? 'opacity-50 rotate-2 shadow-lg' : ''}`}
      onClick={() => onTaskClick(task)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900 text-sm leading-5">{task.title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[task.status]} bg-opacity-20`}>
          {task.status}
        </span>
      </div>

      {task.description && (
        <p className="text-gray-600 text-xs mb-3 line-clamp-2">{task.description}</p>
      )}

      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.map((label, index) => (
            <span
              key={index}
              className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className={`w-3 h-3 rounded-full ${priorityColors[task.priority].replace('border-l-', 'bg-')}`}></span>
          <span className="text-xs text-gray-500">{task.priority}</span>
        </div>

        {task.status === 'todo' && !hasRunningAttempt && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartTask(task);
            }}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            Start
          </button>
        )}

        {hasRunningAttempt && (
          <span className="text-xs text-blue-500 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1"></div>
            Running
          </span>
        )}

        {latestAttempt?.status === 'completed' && (
          <span className="text-xs text-green-500">Completed</span>
        )}
      </div>

      {task.attempts && task.attempts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {task.attempts.length} attempt{task.attempts.length !== 1 ? 's' : ''}
            {latestAttempt && (
              <span className="ml-2">
                Latest: {latestAttempt.executor} ({latestAttempt.status})
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DraggableTaskCard: React.FC<{
  task: Task;
  index: number;
  columnId: string;
  onTaskClick: (task: Task) => void;
  onStartTask: (task: Task) => void;
  onMoveTask: (dragIndex: number, hoverIndex: number, sourceColumnId: string, targetColumnId: string) => void;
}> = ({ task, index, columnId, onTaskClick, onStartTask, onMoveTask }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id, index, sourceColumnId: columnId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div ref={drag}>
      <TaskCard
        task={task}
        onTaskClick={onTaskClick}
        onStartTask={onStartTask}
        isDragging={isDragging}
      />
    </div>
  );
};

const KanbanColumn: React.FC<{
  column: typeof COLUMNS[0];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStartTask: (task: Task) => void;
  onMoveTask: (dragIndex: number, hoverIndex: number, sourceColumnId: string, targetColumnId: string) => void;
}> = ({ column, tasks, onTaskClick, onStartTask, onMoveTask }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item: DragItem) => {
      if (item.sourceColumnId !== column.id) {
        onMoveTask(item.index, tasks.length, item.sourceColumnId, column.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div className={`${column.color} rounded-lg p-4 min-h-[200px]`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-800">{column.title}</h2>
        <span className="bg-white text-gray-600 text-sm px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div
        ref={drop}
        className={`space-y-3 min-h-[150px] ${
          isOver ? 'bg-white bg-opacity-50 rounded-lg' : ''
        }`}
      >
        {tasks.map((task, index) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            index={index}
            columnId={column.id}
            onTaskClick={onTaskClick}
            onStartTask={onStartTask}
            onMoveTask={onMoveTask}
          />
        ))}
      </div>
    </div>
  );
};

export const VibeKanbanBoard: React.FC<{
  projectId: string;
  onTaskSelect: (task: Task) => void;
}> = ({ projectId, onTaskSelect }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);

  // Fetch project and tasks
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch project
        const projectResponse = await fetch(`/vibekanban/projects/${projectId}`);
        if (!projectResponse.ok) throw new Error('Failed to fetch project');
        const projectData = await projectResponse.json();
        setProject(projectData);

        // Fetch tasks
        const tasksResponse = await fetch(`/vibekanban/projects/${projectId}/tasks`);
        if (!tasksResponse.ok) throw new Error('Failed to fetch tasks');
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  // Handle task movement between columns
  const handleMoveTask = async (dragIndex: number, hoverIndex: number, sourceColumnId: string, targetColumnId: string) => {
    if (sourceColumnId === targetColumnId) return;

    // Find the task being moved
    const sourceColumn = COLUMNS.find(col => col.id === sourceColumnId);
    const sourceTasks = tasks.filter(task => task.status === sourceColumnId);
    const task = sourceTasks[dragIndex];
    
    if (!task) return;

    const newStatus = targetColumnId as Task['status'];

    try {
      const response = await fetch(`/vibekanban/projects/${projectId}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update task');

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === task.id ? { ...t, status: newStatus } : t
        )
      );
    } catch (err) {
      console.error('Failed to update task status:', err);
      // TODO: Show error notification
    }
  };

  // Handle task creation from dialog
  const handleTaskCreated = (newTask: Task) => {
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  // Start a new task attempt
  const handleStartTask = async (task: Task) => {
    try {
      // Create a new attempt
      const response = await fetch(`/vibekanban/projects/${projectId}/tasks/${task.id}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executor: 'claude', // Default executor
          base_branch: project?.default_branch || 'main',
        }),
      });

      if (!response.ok) throw new Error('Failed to create attempt');
      const attempt = await response.json();

      // Start the attempt (create worktree)
      const startResponse = await fetch(
        `/vibekanban/projects/${projectId}/tasks/${task.id}/attempts/${attempt.id}/start`,
        { method: 'POST' }
      );

      if (!startResponse.ok) throw new Error('Failed to start attempt');

      // Update task status to in progress
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === task.id
            ? { ...t, status: 'inprogress', attempts: [attempt, ...(t.attempts || [])] }
            : t
        )
      );

      // Select the task to show details
      onTaskSelect({ ...task, status: 'inprogress', attempts: [attempt] });
      
    } catch (err) {
      console.error('Failed to start task:', err);
      // TODO: Show error notification
    }
  };

  // Group tasks by status
  const tasksByStatus = COLUMNS.reduce((acc, column) => {
    acc[column.id] = tasks.filter(task => task.status === column.id);
    return acc;
  }, {} as Record<string, Task[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project?.name || 'Vibe Kanban'}</h1>
          <p className="text-gray-600 text-sm">{project?.git_repo_path}</p>
        </div>
        <button
          onClick={() => setShowNewTaskDialog(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          New Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <DndProvider backend={HTML5Backend}>
          <div className="grid grid-cols-4 gap-6 min-w-[800px] h-full">
            {COLUMNS.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasksByStatus[column.id] || []}
                onTaskClick={onTaskSelect}
                onStartTask={handleStartTask}
                onMoveTask={handleMoveTask}
              />
            ))}
          </div>
        </DndProvider>
      </div>

      {/* New Task Dialog */}
      <NewTaskDialog
        isOpen={showNewTaskDialog}
        onClose={() => setShowNewTaskDialog(false)}
        onTaskCreated={handleTaskCreated}
        projectId={projectId}
      />
    </div>
  );
};