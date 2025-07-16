import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';
// ConnectRPC imports will be added after protobuf generation
// import { createClient } from '@connectrpc/connect';
// import { createConnectTransport } from '@connectrpc/connect-web';
// import { VibeKanbanService } from '../gen/proto/vibekanban/vibekanban_connect';
// import { TaskStatus, TaskPriority } from '../gen/proto/vibekanban/vibekanban_pb';

// TODO: Replace with ConnectRPC client once protobuf files are generated
// const transport = createConnectTransport({
//   baseUrl: '/vibekanban',
// });
// const client = createClient(VibeKanbanService, transport);

// Drag and drop types
const ItemTypes = {
  TASK: 'task',
} as const;

interface DragItem {
  id: string;
  type: string;
  index: number;
  sourceColumn: string;
}

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
  processes?: ExecutionProcess[];
  sessions?: ExecutorSession[];
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

interface ExecutorSession {
  id: string;
  attempt_id: string;
  session_id: string;
  executor: string;
  prompt: string;
  summary?: string;
  messages?: any[];
}

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
  { id: 'inprogress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'inreview', title: 'In Review', color: 'bg-yellow-100' },
  { id: 'done', title: 'Done', color: 'bg-green-100' },
];

const TaskCard: React.FC<{
  task: Task;
  index: number;
  onTaskClick: (task: Task) => void;
  onStartTask: (task: Task) => void;
}> = ({ task, index, onTaskClick, onStartTask }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TASK,
    item: { id: task.id, type: ItemTypes.TASK, index, sourceColumn: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

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
      ref={drag}
      className={`bg-white rounded-lg shadow-sm border-l-4 ${priorityColors[task.priority]} p-4 cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 rotate-2 shadow-lg' : ''
      }`}
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

const KanbanColumn: React.FC<{
  column: typeof COLUMNS[0];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStartTask: (task: Task) => void;
  onTaskDrop: (taskId: string, sourceColumn: string, targetColumn: string) => void;
}> = ({ column, tasks, onTaskClick, onStartTask, onTaskDrop }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.TASK,
    drop: (item: DragItem) => {
      if (item.sourceColumn !== column.id) {
        onTaskDrop(item.id, item.sourceColumn, column.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`${column.color} rounded-lg p-4 h-full ${
        isOver && canDrop ? 'bg-white bg-opacity-50' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-800">{column.title}</h2>
        <span className="bg-white text-gray-600 text-sm px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3 h-full overflow-y-auto pb-16">
        {tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            index={index}
            onTaskClick={onTaskClick}
            onStartTask={onStartTask}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">No tasks yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const VibeKanbanBoard: React.FC<{
  projectId: string;
  onTaskSelect: (task: Task) => void;
  isMobile?: boolean;
}> = ({ projectId, onTaskSelect, isMobile = false }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingTaskMove, setPendingTaskMove] = useState<{
    taskId: string;
    sourceColumn: string;
    targetColumn: string;
  } | null>(null);
  
  // Mobile-specific state
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchCurrentX, setTouchCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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

  // Handle drag and drop
  const handleTaskDrop = async (taskId: string, sourceColumn: string, targetColumn: string) => {
    if (sourceColumn === targetColumn) return;

    // Check if moving to "todo" from another status
    if (targetColumn === 'todo' && sourceColumn !== 'todo') {
      // Find the task being moved
      const task = tasks.find(t => t.id === taskId);
      if (task && task.attempts) {
        // Check if task has running attempts
        const hasRunningAttempts = task.attempts.some(attempt => attempt.status === 'running');
        if (hasRunningAttempts) {
          // Show confirmation dialog instead of proceeding
          setPendingTaskMove({ taskId, sourceColumn, targetColumn });
          setShowConfirmDialog(true);
          return;
        }
      }
    }

    // Proceed with the task move
    await executeTaskMove(taskId, targetColumn);
  };

  // Function to actually execute the task move
  const executeTaskMove = async (taskId: string, targetColumn: string) => {
    const newStatus = targetColumn as Task['status'];

    try {
      const response = await fetch(`/vibekanban/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update task');

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (err) {
      console.error('Failed to update task status:', err);
      // TODO: Show error notification
    }
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

  // Touch handlers for mobile swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchCurrentX(e.touches[0].clientX);
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const currentX = e.touches[0].clientX;
    setTouchCurrentX(currentX);
    
    const diff = Math.abs(currentX - touchStartX);
    if (diff > 10) {
      setIsDragging(true);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || !isDragging) {
      setIsDragging(false);
      return;
    }
    
    const diff = touchCurrentX - touchStartX;
    const threshold = 50;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentColumnIndex > 0) {
        // Swipe right - go to previous column
        setCurrentColumnIndex(currentColumnIndex - 1);
      } else if (diff < 0 && currentColumnIndex < COLUMNS.length - 1) {
        // Swipe left - go to next column
        setCurrentColumnIndex(currentColumnIndex + 1);
      }
    }
    
    setIsDragging(false);
  };

  const navigateToColumn = (index: number) => {
    setCurrentColumnIndex(index);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`flex justify-between items-center ${isMobile ? 'mb-3 px-4 pt-2' : 'mb-6'}`}>
        <div>
          <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-lg' : 'text-2xl'}`}>{project?.name || 'Vibe Kanban'}</h1>
          {!isMobile && <p className="text-gray-600 text-sm">{project?.git_repo_path}</p>}
        </div>
        {!isMobile && (
          <button
            onClick={() => setShowNewTaskDialog(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            New Task
          </button>
        )}
      </div>

      {/* Mobile Column Tabs */}
      {isMobile && (
        <div className="flex border-b border-gray-200 bg-white px-4">
          {COLUMNS.map((column, index) => (
            <button
              key={column.id}
              onClick={() => navigateToColumn(index)}
              className={`flex-1 py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                index === currentColumnIndex
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <span>{column.title}</span>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full ml-1">
                  {tasksByStatus[column.id]?.length || 0}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <DndProvider backend={HTML5Backend}>
          {isMobile ? (
            // Mobile: Single column view with swipe navigation
            <div 
              className="h-full relative overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div 
                className="flex h-full transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(-${currentColumnIndex * 100}%)`,
                  width: `${COLUMNS.length * 100}%`
                }}
              >
                {COLUMNS.map((column, index) => (
                  <div key={column.id} className="w-full px-4 py-4" style={{ width: `${100 / COLUMNS.length}%` }}>
                    <KanbanColumn
                      column={column}
                      tasks={tasksByStatus[column.id] || []}
                      onTaskClick={onTaskSelect}
                      onStartTask={handleStartTask}
                      onTaskDrop={handleTaskDrop}
                    />
                  </div>
                ))}
              </div>
              
              {/* Swipe indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {COLUMNS.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentColumnIndex ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            // Desktop: Traditional grid layout
            <div className="flex-1 overflow-x-auto p-6">
              <div className="grid grid-cols-4 gap-6 min-w-[800px] h-full">
                {COLUMNS.map(column => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    tasks={tasksByStatus[column.id] || []}
                    onTaskClick={onTaskSelect}
                    onStartTask={handleStartTask}
                    onTaskDrop={handleTaskDrop}
                  />
                ))}
              </div>
            </div>
          )}
        </DndProvider>
      </div>

      {/* Mobile FAB for New Task */}
      {isMobile && (
        <button
          onClick={() => setShowNewTaskDialog(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center text-2xl z-10"
        >
          +
        </button>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingTaskMove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Cancel Running Task?</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                This task has running attempts that will be cancelled if you move it back to "To Do".
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <h4 className="text-sm font-medium text-yellow-800 mb-1">This action will:</h4>
                <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                  <li>Cancel all running processes for this task</li>
                  <li>Clean up any git worktrees</li>
                  <li>Mark running attempts as cancelled</li>
                  <li>Move the task back to "To Do" status</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setPendingTaskMove(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (pendingTaskMove) {
                    await executeTaskMove(pendingTaskMove.taskId, pendingTaskMove.targetColumn);
                    setShowConfirmDialog(false);
                    setPendingTaskMove(null);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Yes, Cancel Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};