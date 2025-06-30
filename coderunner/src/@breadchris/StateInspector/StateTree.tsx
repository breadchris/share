import React from 'react';
import { StateNode } from './StateNode';
import { StateTreeProps } from './types';

export const StateTree: React.FC<StateTreeProps> = ({
  data,
  onValueChange,
  onAddProperty,
  onDeleteProperty,
  config,
  parentPath = [],
  depth = 0,
}) => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const entries = Object.entries(data);
  
  if (entries.length === 0) {
    return (
      <div className="empty-object">
        <span className="object-type">{Array.isArray(data) ? '[]' : '{}'}</span>
        <style jsx>{`
          .empty-object {
            color: #6a737d;
            font-style: italic;
          }
          .object-type {
            font-weight: 500;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="state-tree">
      {entries.map(([key, value], index) => {
        const currentPath = [...parentPath, key];
        const pathKey = currentPath.join('.');
        const isExpanded = config.expandedPaths.has(pathKey);

        return (
          <StateNode
            key={`${pathKey}-${index}`}
            keyProp={key}
            value={value}
            path={currentPath}
            onValueChange={onValueChange}
            onAddProperty={onAddProperty}
            onDeleteProperty={onDeleteProperty}
            config={config}
            depth={depth}
            isExpanded={isExpanded}
            onToggleExpanded={() => {
              // This will be handled by the parent StateInspector component
              // We need to pass the path up to update the expandedPaths state
              if (config.onToggleExpanded) {
                config.onToggleExpanded(currentPath);
              }
            }}
          />
        );
      })}
      
      <style jsx>{`
        .state-tree {
          position: relative;
        }
        
        .state-tree::before {
          content: '';
          position: absolute;
          left: ${depth * 20 + 8}px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: #e1e4e8;
          display: ${depth > 0 ? 'block' : 'none'};
        }
      `}</style>
    </div>
  );
};