import React, { useState, useCallback, useMemo } from 'react';
import { StateTree } from './StateTree';
import { StateInspectorProps, StateInspectorConfig } from './types';
import { setValueAtPath, deleteValueAtPath } from './utils';

const defaultConfig: Required<StateInspectorConfig> = {
  readOnly: false,
  maxDepth: 10,
  showTypes: true,
  enableHistory: false,
  customRenderers: {},
  collapsedByDefault: false,
  showArrayIndices: true,
  expandedPaths: new Set(),
  onToggleExpanded: () => {},
};

export const StateInspector: React.FC<StateInspectorProps> = ({
  state,
  onStateChange,
  onAddProperty,
  onDeleteProperty,
  config: userConfig = {},
  schema,
  history,
  onHistoryChange,
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const handleToggleExpanded = useCallback((path: string[]) => {
    const pathKey = path.join('.');
    const newExpandedPaths = new Set(expandedPaths);
    
    if (expandedPaths.has(pathKey)) {
      newExpandedPaths.delete(pathKey);
    } else {
      newExpandedPaths.add(pathKey);
    }
    
    setExpandedPaths(newExpandedPaths);
  }, [expandedPaths]);

  const config = useMemo(() => ({
    ...defaultConfig,
    ...userConfig,
    expandedPaths,
    onToggleExpanded: handleToggleExpanded,
  }), [userConfig, expandedPaths, handleToggleExpanded]);

  const handleValueChange = useCallback((path: string[], value: any) => {
    if (!onStateChange || config.readOnly) return;

    const newState = setValueAtPath(state, path, value);
    onStateChange(newState, path);
  }, [state, onStateChange, config.readOnly]);

  const handleAddProperty = useCallback((path: string[], key: string, value: any) => {
    if (!onStateChange || config.readOnly) return;

    const newPath = [...path, key];
    const newState = setValueAtPath(state, newPath, value);
    onStateChange(newState, newPath);
    
    // Auto-expand the parent object when adding a property
    const pathKey = path.join('.');
    if (pathKey && !expandedPaths.has(pathKey)) {
      setExpandedPaths(prev => new Set(prev).add(pathKey));
    }
    
    if (onAddProperty) {
      onAddProperty(path, key, value);
    }
  }, [state, onStateChange, onAddProperty, config.readOnly, expandedPaths]);

  const handleDeleteProperty = useCallback((path: string[]) => {
    if (!onStateChange || config.readOnly) return;

    const newState = deleteValueAtPath(state, path);
    onStateChange(newState, path);
    
    if (onDeleteProperty) {
      onDeleteProperty(path);
    }
  }, [state, onStateChange, onDeleteProperty, config.readOnly]);

  return (
    <div className="state-inspector">
      <div className="state-inspector-header">
        <h3>React State Inspector</h3>
        <div className="state-inspector-controls">
          {config.enableHistory && history && (
            <div className="history-controls">
              <button disabled={history.past.length === 0}>Undo</button>
              <button disabled={history.future.length === 0}>Redo</button>
            </div>
          )}
          <button 
            onClick={() => setExpandedPaths(new Set())}
            className="collapse-all"
          >
            Collapse All
          </button>
          <button 
            onClick={() => {
              const allPaths = new Set<string>();
              const collectPaths = (obj: any, currentPath: string[] = []) => {
                if (currentPath.length >= config.maxDepth) return;
                
                Object.keys(obj).forEach(key => {
                  const newPath = [...currentPath, key];
                  const pathKey = newPath.join('.');
                  allPaths.add(pathKey);
                  
                  if (obj[key] && typeof obj[key] === 'object') {
                    collectPaths(obj[key], newPath);
                  }
                });
              };
              collectPaths(state);
              setExpandedPaths(allPaths);
            }}
            className="expand-all"
          >
            Expand All
          </button>
        </div>
      </div>
      
      <div className="state-inspector-content">
        <StateTree
          data={state}
          onValueChange={handleValueChange}
          onAddProperty={handleAddProperty}
          onDeleteProperty={handleDeleteProperty}
          config={config}
          parentPath={[]}
          depth={0}
        />
      </div>
      
      <style jsx>{`
        .state-inspector {
          border: 1px solid #e1e4e8;
          border-radius: 6px;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          font-size: 12px;
        }
        
        .state-inspector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f6f8fa;
          border-bottom: 1px solid #e1e4e8;
          border-radius: 6px 6px 0 0;
        }
        
        .state-inspector-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #24292e;
        }
        
        .state-inspector-controls {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .history-controls {
          display: flex;
          gap: 4px;
        }
        
        .state-inspector-controls button {
          padding: 4px 8px;
          border: 1px solid #d1d5da;
          border-radius: 3px;
          background: #ffffff;
          color: #586069;
          font-size: 11px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .state-inspector-controls button:hover:not(:disabled) {
          background: #f6f8fa;
        }
        
        .state-inspector-controls button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .state-inspector-content {
          padding: 8px;
          max-height: 400px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};