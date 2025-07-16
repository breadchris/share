import React, { useState, useEffect } from 'react';

interface Project {
  id: string;
  name: string;
  git_repo_path: string;
  setup_script?: string;
  dev_script?: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

const NewProjectDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}> = ({ isOpen, onClose, onProjectCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    git_repo_path: '',
    setup_script: '',
    dev_script: '',
    default_branch: 'main',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.git_repo_path) {
      setError('Name and Git repository path are required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/vibekanban/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const project = await response.json();
      onProjectCreated(project);
      onClose();
      setFormData({
        name: '',
        git_repo_path: '',
        setup_script: '',
        dev_script: '',
        default_branch: 'main',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">New Project</h2>
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
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My Awesome Project"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Git Repository Path *
            </label>
            <input
              type="text"
              value={formData.git_repo_path}
              onChange={(e) => setFormData({ ...formData, git_repo_path: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="/path/to/your/repo"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Absolute path to local Git repository</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Branch
            </label>
            <input
              type="text"
              value={formData.default_branch}
              onChange={(e) => setFormData({ ...formData, default_branch: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="main"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Setup Script
            </label>
            <textarea
              value={formData.setup_script}
              onChange={(e) => setFormData({ ...formData, setup_script: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="npm install"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">Commands to set up the project</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dev Script
            </label>
            <textarea
              value={formData.dev_script}
              onChange={(e) => setFormData({ ...formData, dev_script: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="npm run dev"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">Commands to start development server</p>
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
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProjectCard: React.FC<{
  project: Project;
  onSelect: (project: Project) => void;
  onDelete: (project: Project) => void;
}> = ({ project, onSelect, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const taskCounts = project.tasks?.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const totalTasks = project.tasks?.length || 0;
  const completedTasks = taskCounts.done || 0;
  const inProgressTasks = taskCounts.inprogress || 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
          <p className="text-sm text-gray-600 break-all">{project.git_repo_path}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onSelect(project)}
            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            Open
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-xs text-gray-500">Default Branch</span>
          <p className="font-mono text-sm">{project.default_branch}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">Created</span>
          <p className="text-sm">{new Date(project.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {(project.setup_script || project.dev_script) && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Scripts</div>
          <div className="space-y-1">
            {project.setup_script && (
              <div className="text-xs">
                <span className="text-gray-600">Setup:</span>{' '}
                <code className="bg-gray-100 px-1 rounded">{project.setup_script}</code>
              </div>
            )}
            {project.dev_script && (
              <div className="text-xs">
                <span className="text-gray-600">Dev:</span>{' '}
                <code className="bg-gray-100 px-1 rounded">{project.dev_script}</code>
              </div>
            )}
          </div>
        </div>
      )}

      {totalTasks > 0 && (
        <div className="border-t pt-4">
          <div className="text-xs text-gray-500 mb-2">Tasks</div>
          <div className="flex justify-between items-center">
            <div className="flex space-x-4 text-sm">
              <span className="text-gray-600">{totalTasks} total</span>
              {inProgressTasks > 0 && (
                <span className="text-blue-600">{inProgressTasks} in progress</span>
              )}
              {completedTasks > 0 && (
                <span className="text-green-600">{completedTasks} completed</span>
              )}
            </div>
            {totalTasks > 0 && (
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Project</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{project.name}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(project);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProjectList: React.FC<{
  onProjectSelect: (project: Project) => void;
}> = ({ onProjectSelect }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/vibekanban/projects');
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectCreated = (project: Project) => {
    setProjects(prev => [project, ...prev]);
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      const response = await fetch(`/vibekanban/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setProjects(prev => prev.filter(p => p.id !== project.id));
    } catch (err) {
      console.error('Failed to delete project:', err);
      // TODO: Show error notification
    }
  };

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
          onClick={fetchProjects}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vibe Kanban Projects</h1>
          <p className="text-gray-600 mt-2">
            Manage your AI-assisted coding projects
          </p>
        </div>
        <button
          onClick={() => setShowNewProjectDialog(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first project.</p>
          <button
            onClick={() => setShowNewProjectDialog(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={onProjectSelect}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      )}

      <NewProjectDialog
        isOpen={showNewProjectDialog}
        onClose={() => setShowNewProjectDialog(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};