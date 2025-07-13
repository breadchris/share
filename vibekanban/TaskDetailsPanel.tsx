import React, { useState, useEffect } from 'react';

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

const DiffTab: React.FC<{ attempt: TaskAttempt; projectId: string; taskId: string }> = ({
  attempt,
  projectId,
  taskId,
}) => {
  const [diff, setDiff] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiff = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/vibe-kanban/projects/${projectId}/tasks/${taskId}/attempts/${attempt.id}/diff`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch diff');
      }
      
      const data = await response.json();
      setDiff(data.diff || 'No changes yet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch diff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (attempt.id) {
      fetchDiff();
    }
  }, [attempt.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4 text-sm">{error}</div>
        <button
          onClick={fetchDiff}
          className="text-blue-500 text-sm hover:text-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Git Diff</h3>
        <button
          onClick={fetchDiff}
          className="text-blue-500 text-sm hover:text-blue-700"
        >
          Refresh
        </button>
      </div>
      
      {diff ? (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-auto h-[400px] font-mono">
          {diff}
        </pre>
      ) : (
        <div className="text-gray-500 text-center py-8 text-sm">
          No changes yet
        </div>
      )}
    </div>
  );
};

const LogsTab: React.FC<{ attempt: TaskAttempt; projectId: string; taskId: string }> = ({
  attempt,
  projectId,
  taskId,
}) => {
  const [processes, setProcesses] = useState<ExecutionProcess[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<ExecutionProcess | null>(null);
  const [processOutput, setProcessOutput] = useState<{ stdout: string; stderr: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProcesses = async () => {
    try {
      const response = await fetch(
        `/api/vibe-kanban/projects/${projectId}/tasks/${taskId}/attempts/${attempt.id}/processes`
      );
      
      if (response.ok) {
        const data = await response.json();
        setProcesses(data);
        if (data.length > 0 && !selectedProcess) {
          setSelectedProcess(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch processes:', err);
    }
  };

  const fetchProcessOutput = async (processId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vibe-kanban/processes/${processId}/output`);
      
      if (response.ok) {
        const data = await response.json();
        setProcessOutput(data);
      }
    } catch (err) {
      console.error('Failed to fetch process output:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (attempt.id) {
      fetchProcesses();
    }
  }, [attempt.id]);

  useEffect(() => {
    if (selectedProcess) {
      fetchProcessOutput(selectedProcess.id);
    }
  }, [selectedProcess]);

  const statusColors = {
    pending: 'text-yellow-600 bg-yellow-100',
    running: 'text-blue-600 bg-blue-100',
    completed: 'text-green-600 bg-green-100',
    failed: 'text-red-600 bg-red-100',
    killed: 'text-gray-600 bg-gray-100',
  };

  return (
    <div className="h-full">
      <h3 className="font-medium mb-4">Process Logs</h3>
      
      {processes.length === 0 ? (
        <div className="text-gray-500 text-center py-8 text-sm">
          No processes started yet
        </div>
      ) : (
        <div className="space-y-4">
          {/* Process List */}
          <div className="space-y-2">
            {processes.map(process => (
              <div
                key={process.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedProcess?.id === process.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedProcess(process)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-sm">{process.type}</span>
                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${statusColors[process.status]}`}>
                      {process.status}
                    </span>
                  </div>
                  {process.start_time && (
                    <span className="text-xs text-gray-500">
                      {new Date(process.start_time).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                
                {process.command && (
                  <div className="mt-1 text-xs text-gray-600 font-mono">
                    {process.command.length > 50 
                      ? `${process.command.substring(0, 50)}...`
                      : process.command
                    }
                  </div>
                )}
                
                {process.url && (
                  <div className="mt-1">
                    <a
                      href={process.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {process.url} ↗
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Process Output */}
          {selectedProcess && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">
                  Output - {selectedProcess.type}
                </h4>
                <button
                  onClick={() => fetchProcessOutput(selectedProcess.id)}
                  className="text-blue-500 text-xs hover:text-blue-700"
                >
                  Refresh
                </button>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              ) : processOutput ? (
                <div className="space-y-3">
                  {processOutput.stdout && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">STDOUT</h5>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-auto max-h-48 font-mono">
                        {processOutput.stdout}
                      </pre>
                    </div>
                  )}
                  
                  {processOutput.stderr && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">STDERR</h5>
                      <pre className="bg-gray-900 text-red-400 p-3 rounded text-xs overflow-auto max-h-48 font-mono">
                        {processOutput.stderr}
                      </pre>
                    </div>
                  )}
                  
                  {!processOutput.stdout && !processOutput.stderr && (
                    <div className="text-gray-500 text-center py-4 text-sm">
                      No output yet
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4 text-sm">
                  Failed to load output
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ConversationTab: React.FC<{ attempt: TaskAttempt }> = ({ attempt }) => {
  const [prompt, setPrompt] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendPrompt = async () => {
    if (!prompt.trim() || sending) return;

    setSending(true);
    try {
      // This would integrate with the coding agent API
      const response = await fetch(
        `/api/vibe-kanban/projects/${attempt.task_id}/tasks/${attempt.task_id}/attempts/${attempt.id}/processes/agent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        }
      );

      if (response.ok) {
        setPrompt('');
        // TODO: Update conversation history
      }
    } catch (err) {
      console.error('Failed to send prompt:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-medium mb-4">AI Conversation</h3>
      
      {/* Conversation History */}
      <div className="flex-1 border rounded-lg p-4 bg-gray-50 mb-4 overflow-auto">
        {attempt.sessions && attempt.sessions.length > 0 ? (
          <div className="space-y-4">
            {attempt.sessions.map(session => (
              <div key={session.id} className="bg-white rounded p-3">
                <div className="text-xs text-gray-500 mb-2">
                  {session.executor} • {session.session_id}
                </div>
                <div className="text-sm">{session.prompt}</div>
                {session.summary && (
                  <div className="mt-2 text-sm text-gray-600 italic">
                    {session.summary}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8 text-sm">
            No conversation history yet
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter instructions for the AI agent..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Executor: {attempt.executor}
          </div>
          <button
            onClick={handleSendPrompt}
            disabled={!prompt.trim() || sending}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const TaskDetailsPanel: React.FC<{
  task: Task;
  projectId: string;
  onClose: () => void;
}> = ({ task, projectId, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'diff' | 'logs' | 'conversation'>('overview');
  const [selectedAttempt, setSelectedAttempt] = useState<TaskAttempt | null>(null);

  useEffect(() => {
    if (task.attempts && task.attempts.length > 0) {
      setSelectedAttempt(task.attempts[0]);
    }
  }, [task.attempts]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'diff', label: 'Diff', disabled: !selectedAttempt },
    { id: 'logs', label: 'Logs', disabled: !selectedAttempt },
    { id: 'conversation', label: 'Chat', disabled: !selectedAttempt },
  ];

  const priorityColors = {
    low: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    high: 'text-red-600 bg-red-100',
  };

  const statusColors = {
    todo: 'text-gray-600 bg-gray-100',
    inprogress: 'text-blue-600 bg-blue-100',
    inreview: 'text-yellow-600 bg-yellow-100',
    done: 'text-green-600 bg-green-100',
    cancelled: 'text-red-600 bg-red-100',
  };

  return (
    <div className="fixed inset-y-0 right-0 w-1/2 max-w-2xl bg-white shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h2>
            <div className="flex items-center space-x-3">
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[task.status]}`}>
                {task.status}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : tab.disabled
                  ? 'border-transparent text-gray-300 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              disabled={tab.disabled}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-600 text-sm">
                {task.description || 'No description provided'}
              </p>
            </div>

            {task.labels && task.labels.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Labels</h3>
                <div className="flex flex-wrap gap-2">
                  {task.labels.map((label, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-medium mb-2">Attempts</h3>
              {task.attempts && task.attempts.length > 0 ? (
                <div className="space-y-3">
                  {task.attempts.map(attempt => (
                    <div
                      key={attempt.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedAttempt?.id === attempt.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedAttempt(attempt)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{attempt.executor}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[attempt.status] || 'text-gray-600 bg-gray-100'}`}>
                          {attempt.status}
                        </span>
                      </div>
                      
                      {attempt.branch && (
                        <div className="text-xs text-gray-600 mb-1">
                          Branch: <code className="bg-gray-100 px-1 rounded">{attempt.branch}</code>
                        </div>
                      )}
                      
                      {attempt.start_time && (
                        <div className="text-xs text-gray-500">
                          Started: {new Date(attempt.start_time).toLocaleString()}
                        </div>
                      )}
                      
                      {attempt.pr_url && (
                        <div className="mt-2">
                          <a
                            href={attempt.pr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:text-blue-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View PR ↗
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No attempts yet</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created</span>
                <p>{new Date(task.created_at).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Updated</span>
                <p>{new Date(task.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'diff' && selectedAttempt && (
          <DiffTab
            attempt={selectedAttempt}
            projectId={projectId}
            taskId={task.id}
          />
        )}

        {activeTab === 'logs' && selectedAttempt && (
          <LogsTab
            attempt={selectedAttempt}
            projectId={projectId}
            taskId={task.id}
          />
        )}

        {activeTab === 'conversation' && selectedAttempt && (
          <ConversationTab attempt={selectedAttempt} />
        )}
      </div>
    </div>
  );
};