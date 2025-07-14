import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { createConnectTransport } from '@connectrpc/connect-web';
import { createClient } from '@connectrpc/connect';
import type {
  GetProjectRequest,
  GetTasksRequest,
  CreateTaskRequest,
  CreateTaskAttemptRequest,
  StartTaskAttemptRequest,
  UpdateTaskRequest,
} from '../gen/proto/vibekanban/vibekanban_pb';
import {
  TaskStatus,
  TaskPriority,
  AttemptStatus,
  Project as ProtoProject,
  Task as ProtoTask,
  TaskAttempt as ProtoTaskAttempt,
  VibeKanbanService
} from '../gen/proto/vibekanban/vibekanban_pb';

// Create the transport and client
const transport = createConnectTransport({
  baseUrl: '/vibekanban',
});

const client = createClient(VibeKanbanService, transport);

// Type aliases for easier usage
type Project = ProtoProject;
type Task = ProtoTask;
type TaskAttempt = ProtoTaskAttempt;

// Helper functions to convert between protobuf enums and strings
function statusToEnum(status: string): TaskStatus {
  switch (status) {
    case 'todo': return TaskStatus.TODO;
    case 'inprogress': return TaskStatus.IN_PROGRESS;
    case 'inreview': return TaskStatus.IN_REVIEW;
    case 'done': return TaskStatus.DONE;
    case 'cancelled': return TaskStatus.CANCELLED;
    default: return TaskStatus.TODO;
  }
}

function priorityToEnum(priority: string): TaskPriority {
  switch (priority) {
    case 'low': return TaskPriority.LOW;
    case 'medium': return TaskPriority.MEDIUM;
    case 'high': return TaskPriority.HIGH;
    default: return TaskPriority.MEDIUM;
  }
}

function enumToStatus(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.TODO: return 'todo';
    case TaskStatus.IN_PROGRESS: return 'inprogress';
    case TaskStatus.IN_REVIEW: return 'inreview';
    case TaskStatus.DONE: return 'done';
    case TaskStatus.CANCELLED: return 'cancelled';
    default: return 'todo';
  }
}

function enumToPriority(priority: TaskPriority): string {
  switch (priority) {
    case TaskPriority.LOW: return 'low';
    case TaskPriority.MEDIUM: return 'medium';
    case TaskPriority.HIGH: return 'high';
    default: return 'medium';
  }
}

interface TaskForm {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  labels: string;
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
  const [formData, setFormData] = useState<TaskForm>({
    title: '',
    description: '',
    priority: 'medium',
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
      const labels = formData.labels.trim() ? formData.labels.split(',').map(l => l.trim()).filter(l => l) : [];
      
      const request = new CreateTaskRequest({
        projectId: projectId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: priorityToEnum(formData.priority),
        labels: labels,
        metadata: {}
      });

      const response = await client.createTask(request);
      if (response.task) {
        onTaskCreated(response.task);
      }
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
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskForm['priority'] })}
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
              placeholder="Enter labels separated by commas"
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple labels with commas</p>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
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
  const latestAttempt = task.attempts && task.attempts.length > 0 ? task.attempts[0] : null;
  const hasRunningAttempt = latestAttempt?.status === AttemptStatus.RUNNING;
  const priorityColor = {
    [TaskPriority.HIGH]: 'border-red-300',
    [TaskPriority.MEDIUM]: 'border-yellow-300',
    [TaskPriority.LOW]: 'border-green-300',
  }[task.priority] || 'border-gray-300';

  return (
    <div
      className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${priorityColor} cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={() => onTaskClick(task)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{task.title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${
          task.priority === TaskPriority.HIGH
            ? 'bg-red-100 text-red-800'
            : task.priority === TaskPriority.MEDIUM
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {enumToPriority(task.priority)}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.map((label, index) => (
            <span
              key={index}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center">
        {!hasRunningAttempt && enumToStatus(task.status) === 'todo' && (
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

        {latestAttempt?.status === AttemptStatus.COMPLETED && (
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
        const projectRequest = new GetProjectRequest({ id: projectId });
        const projectResponse = await client.getProject(projectRequest);
        if (projectResponse.project) {
          setProject(projectResponse.project);
        }

        // Fetch tasks
        const tasksRequest = new GetTasksRequest({ projectId: projectId });
        const tasksResponse = await client.getTasks(tasksRequest);
        setTasks(tasksResponse.tasks);
        
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
    const sourceTasks = tasks.filter(task => enumToStatus(task.status) === sourceColumnId);
    const task = sourceTasks[dragIndex];
    
    if (!task) return;

    const newStatus = statusToEnum(targetColumnId);

    try {
      const request = new UpdateTaskRequest({
        id: task.id,
        status: newStatus,
      });

      await client.updateTask(request);

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
      const createRequest = new CreateTaskAttemptRequest({
        taskId: task.id,
        executor: 'claude', // Default executor
        baseBranch: project?.defaultBranch || 'main',
      });

      const createResponse = await client.createTaskAttempt(createRequest);
      if (!createResponse.attempt) {
        throw new Error('Failed to create attempt');
      }

      // Start the attempt (create worktree)
      const startRequest = new StartTaskAttemptRequest({
        attemptId: createResponse.attempt.id,
      });

      await client.startTaskAttempt(startRequest);

      // Update task status to in progress
      const updatedTask = {
        ...task,
        status: TaskStatus.IN_PROGRESS,
        attempts: [createResponse.attempt, ...(task.attempts || [])]
      };

      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === task.id ? updatedTask : t
        )
      );

      // Select the task to show details
      onTaskSelect(updatedTask);
      
    } catch (err) {
      console.error('Failed to start task:', err);
      // TODO: Show error notification
    }
  };

  // Group tasks by status
  const tasksByStatus = COLUMNS.reduce((acc, column) => {
    acc[column.id] = tasks.filter(task => enumToStatus(task.status) === column.id);
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
          <p className="text-gray-600 text-sm">{project?.gitRepoPath}</p>
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

const VibeKanban: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Extract projectId from URL params or provide a default
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId') || 'default-project-id';

  return (
    <div className="h-screen bg-gray-50 p-6">
      <VibeKanbanBoard
        projectId={projectId}
        onTaskSelect={setSelectedTask}
      />
      
      {/* Task Details Panel - could be implemented later */}
      {selectedTask && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg border-l border-gray-200 p-6 z-40">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Task Details</h2>
            <button
              onClick={() => setSelectedTask(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">{selectedTask.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedTask.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 font-medium">{enumToStatus(selectedTask.status)}</span>
              </div>
              <div>
                <span className="text-gray-500">Priority:</span>
                <span className="ml-2 font-medium">{enumToPriority(selectedTask.priority)}</span>
              </div>
            </div>
            
            {selectedTask.attempts && selectedTask.attempts.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Attempts</h4>
                <div className="space-y-2">
                  {selectedTask.attempts.map((attempt) => (
                    <div key={attempt.id} className="p-2 bg-gray-50 rounded">
                      <div className="text-sm">
                        <span className="font-medium">{attempt.executor}</span>
                        <span className="ml-2 text-gray-500">({attempt.status})</span>
                      </div>
                      {attempt.branch && (
                        <div className="text-xs text-gray-600 mt-1">
                          Branch: {attempt.branch}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VibeKanban;