import React, { useState } from 'react';
import { StateInspector } from './StateInspector';

interface User {
  id: number;
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
}

export const StateInspectorExample: React.FC = () => {
  // Example state that mimics a real React component
  const [appState, setAppState] = useState({
    user: {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      preferences: {
        theme: 'light' as const,
        notifications: true,
        language: 'en',
      },
    },
    ui: {
      isLoading: false,
      selectedTab: 'profile',
      sidebarOpen: true,
      modal: null,
    },
    data: {
      posts: [
        { id: 1, title: 'First Post', published: true },
        { id: 2, title: 'Draft Post', published: false },
      ],
      comments: [],
      analytics: {
        pageViews: 1234,
        uniqueVisitors: 456,
        conversionRate: 0.045,
      },
    },
    settings: {
      apiUrl: 'https://api.example.com',
      timeout: 5000,
      retryAttempts: 3,
    },
  });

  const [inspectorConfig, setInspectorConfig] = useState({
    readOnly: false,
    showTypes: true,
    maxDepth: 10,
    collapsedByDefault: false,
  });

  // Handler for when state changes through the inspector
  const handleStateChange = (newState: any, path: string[]) => {
    console.log('State changed at path:', path, 'New state:', newState);
    setAppState(newState);
  };

  // Handler for when properties are added
  const handleAddProperty = (path: string[], key: string, value: any) => {
    console.log('Property added at path:', path, 'Key:', key, 'Value:', value);
  };

  // Handler for when properties are deleted
  const handleDeleteProperty = (path: string[]) => {
    console.log('Property deleted at path:', path);
  };

  // Simulate app functionality that modifies state
  const simulateUserAction = () => {
    setAppState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        isLoading: true,
        selectedTab: prev.ui.selectedTab === 'profile' ? 'settings' : 'profile',
      },
      data: {
        ...prev.data,
        analytics: {
          ...prev.data.analytics,
          pageViews: prev.data.analytics.pageViews + Math.floor(Math.random() * 10),
        },
      },
    }));

    // Simulate async operation
    setTimeout(() => {
      setAppState(prev => ({
        ...prev,
        ui: { ...prev.ui, isLoading: false },
      }));
    }, 1000);
  };

  const addNewPost = () => {
    setAppState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        posts: [
          ...prev.data.posts,
          {
            id: prev.data.posts.length + 1,
            title: `New Post ${prev.data.posts.length + 1}`,
            published: false,
          },
        ],
      },
    }));
  };

  return (
    <div className="state-inspector-example">
      <h2>React State Inspector Demo</h2>
      
      <div className="demo-layout">
        <div className="demo-app">
          <h3>Demo App</h3>
          <div className="app-content">
            <div className="user-info">
              <h4>User: {appState.user.name}</h4>
              <p>Email: {appState.user.email}</p>
              <p>Theme: {appState.user.preferences.theme}</p>
              <p>Current Tab: {appState.ui.selectedTab}</p>
              {appState.ui.isLoading && <p>Loading...</p>}
            </div>
            
            <div className="posts">
              <h4>Posts ({appState.data.posts.length})</h4>
              {appState.data.posts.map(post => (
                <div key={post.id} className="post">
                  {post.title} {post.published ? '✓' : '○'}
                </div>
              ))}
            </div>
            
            <div className="analytics">
              <h4>Analytics</h4>
              <p>Page Views: {appState.data.analytics.pageViews}</p>
              <p>Unique Visitors: {appState.data.analytics.uniqueVisitors}</p>
              <p>Conversion Rate: {(appState.data.analytics.conversionRate * 100).toFixed(1)}%</p>
            </div>
          </div>
          
          <div className="demo-actions">
            <button onClick={simulateUserAction}>Simulate User Action</button>
            <button onClick={addNewPost}>Add New Post</button>
            <button onClick={() => setAppState(prev => ({
              ...prev,
              user: {
                ...prev.user,
                preferences: {
                  ...prev.user.preferences,
                  theme: prev.user.preferences.theme === 'light' ? 'dark' : 'light',
                },
              },
            }))}>
              Toggle Theme
            </button>
          </div>
        </div>
        
        <div className="inspector-panel">
          <h3>State Inspector</h3>
          
          <div className="inspector-config">
            <label>
              <input
                type="checkbox"
                checked={inspectorConfig.readOnly}
                onChange={(e) => setInspectorConfig(prev => ({
                  ...prev,
                  readOnly: e.target.checked,
                }))}
              />
              Read Only
            </label>
            <label>
              <input
                type="checkbox"
                checked={inspectorConfig.showTypes}
                onChange={(e) => setInspectorConfig(prev => ({
                  ...prev,
                  showTypes: e.target.checked,
                }))}
              />
              Show Types
            </label>
          </div>
          
          <StateInspector
            state={appState}
            onStateChange={handleStateChange}
            onAddProperty={handleAddProperty}
            onDeleteProperty={handleDeleteProperty}
            config={inspectorConfig}
          />
        </div>
      </div>
      
      <style jsx>{`
        .state-inspector-example {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .demo-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 20px;
        }
        
        .demo-app {
          border: 1px solid #e1e4e8;
          border-radius: 6px;
          padding: 16px;
          background: #f6f8fa;
        }
        
        .app-content {
          margin: 16px 0;
        }
        
        .user-info, .posts, .analytics {
          margin-bottom: 16px;
          padding: 12px;
          background: white;
          border-radius: 4px;
          border: 1px solid #e1e4e8;
        }
        
        .user-info h4, .posts h4, .analytics h4 {
          margin: 0 0 8px 0;
          color: #24292e;
        }
        
        .user-info p, .analytics p {
          margin: 4px 0;
          color: #586069;
        }
        
        .post {
          padding: 4px 0;
          color: #586069;
        }
        
        .demo-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .demo-actions button {
          padding: 6px 12px;
          border: 1px solid #d1d5da;
          border-radius: 3px;
          background: white;
          color: #24292e;
          cursor: pointer;
          font-size: 12px;
        }
        
        .demo-actions button:hover {
          background: #f6f8fa;
        }
        
        .inspector-panel {
          border: 1px solid #e1e4e8;
          border-radius: 6px;
          padding: 16px;
        }
        
        .inspector-config {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          padding: 8px;
          background: #f6f8fa;
          border-radius: 4px;
        }
        
        .inspector-config label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #24292e;
        }
        
        h2, h3 {
          color: #24292e;
          margin: 0 0 16px 0;
        }
      `}</style>
    </div>
  );
};