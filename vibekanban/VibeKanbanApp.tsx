import React, { useState, useEffect } from 'react';
import { ProjectList } from './ProjectList';
import { VibeKanbanBoard } from './VibeKanban';
import { TaskDetailsPanel } from './TaskDetailsPanel';

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

export const VibeKanbanApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'projects' | 'kanban'>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('kanban');
  };

  const handleBackToProjects = () => {
    setCurrentView('projects');
    setSelectedProject(null);
    setSelectedTask(null);
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    // In a full implementation, this would open a task details panel
    console.log('Selected task:', task);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">VK</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">Vibe Kanban</span>
              </div>
              
              {currentView === 'kanban' && selectedProject && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <span>/</span>
                  <button
                    onClick={handleBackToProjects}
                    className="text-blue-500 hover:text-blue-700 font-medium"
                  >
                    Projects
                  </button>
                  <span>/</span>
                  <span className="text-gray-900 font-medium">{selectedProject.name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {currentView === 'kanban' && (
                <button
                  onClick={handleBackToProjects}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ← Back to Projects
                </button>
              )}
              
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm font-medium">U</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="h-[calc(100vh-4rem)]">
        {currentView === 'projects' ? (
          <ProjectList onProjectSelect={handleProjectSelect} />
        ) : (
          selectedProject && (
            <div className={`h-full ${isMobile ? 'p-0' : 'p-6'}`}>
              <VibeKanbanBoard
                projectId={selectedProject.id}
                onTaskSelect={handleTaskSelect}
                isMobile={isMobile}
              />
            </div>
          )
        )}
      </main>

      {/* Task Details Panel */}
      {selectedTask && selectedProject && (
        <TaskDetailsPanel
          task={selectedTask}
          projectId={selectedProject.id}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};