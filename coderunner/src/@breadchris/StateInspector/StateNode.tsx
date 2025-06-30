import React, { useState } from 'react';
import { StateTree } from './StateTree';
import { StateNodeProps } from './types';
import { AddPropertyDialog } from './AddPropertyDialog';
import { DeletePropertyDialog } from './DeletePropertyDialog';

const getValueType = (value: any): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

const getValuePreview = (value: any, type: string): string => {
  switch (type) {
    case 'string':
      return `"${value.length > 50 ? value.substring(0, 50) + '...' : value}"`;
    case 'number':
    case 'boolean':
      return String(value);
    case 'null':
      return 'null';
    case 'undefined':
      return 'undefined';
    case 'array':
      return `Array(${value.length})`;
    case 'object':
      const keys = Object.keys(value);
      return `Object(${keys.length})`;
    default:
      return String(value);
  }
};

const isExpandable = (value: any): boolean => {
  return value !== null && 
         value !== undefined && 
         typeof value === 'object';
};

export const StateNode: React.FC<StateNodeProps> = ({
  keyProp,
  value,
  path,
  onValueChange,
  onAddProperty,
  onDeleteProperty,
  config,
  depth,
  isExpanded,
  onToggleExpanded,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const valueType = getValueType(value);
  const valuePreview = getValuePreview(value, valueType);
  const canExpand = isExpandable(value);
  const hasChildren = canExpand && Object.keys(value).length > 0;
  const shouldShowExpander = hasChildren && depth < config.maxDepth;
  const canAddProperties = canExpand; // Can add properties to any object/array

  const handleStartEdit = () => {
    if (config.readOnly || (valueType !== 'string' && valueType !== 'number' && valueType !== 'boolean')) {
      return;
    }
    setEditValue(valueType === 'string' ? value : String(value));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!onValueChange) return;

    let newValue: any;
    try {
      if (valueType === 'number') {
        newValue = parseFloat(editValue);
        if (isNaN(newValue)) throw new Error('Invalid number');
      } else if (valueType === 'boolean') {
        newValue = editValue.toLowerCase() === 'true';
      } else {
        newValue = editValue;
      }
      onValueChange(path, newValue);
    } catch (error) {
      console.error('Invalid value:', error);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const handleAddProperty = (key: string, newValue: any) => {
    if (onAddProperty) {
      onAddProperty(path, key, newValue);
    }
  };

  const handleDeleteProperty = () => {
    if (onDeleteProperty) {
      onDeleteProperty(path);
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'string': return '#032f62';
      case 'number': return '#005cc5';
      case 'boolean': return '#d73a49';
      case 'null':
      case 'undefined': return '#6a737d';
      case 'object':
      case 'array': return '#6f42c1';
      default: return '#24292e';
    }
  };

  return (
    <div className="state-node">
      <div className="node-line">
        {shouldShowExpander && (
          <button 
            className="expand-button"
            onClick={onToggleExpanded}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        
        <span className="key-name">
          {config.showArrayIndices && /^\d+$/.test(keyProp) ? `[${keyProp}]` : keyProp}:
        </span>
        
        {config.showTypes && (
          <span className="value-type">({valueType})</span>
        )}
        
        {isEditing ? (
          <div className="edit-controls">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="edit-input"
              autoFocus
            />
            <button onClick={handleSaveEdit} className="save-button">✓</button>
            <button onClick={handleCancelEdit} className="cancel-button">✗</button>
          </div>
        ) : (
          <span 
            className="value-preview"
            onClick={handleStartEdit}
            title={config.readOnly ? 'Read-only' : 'Click to edit'}
          >
            {valuePreview}
          </span>
        )}
        
        {!config.readOnly && (
          <div className="action-buttons">
            {canAddProperties && (
              <button 
                onClick={() => setShowAddDialog(true)}
                className="add-button"
                title="Add property"
              >
                +
              </button>
            )}
            <button 
              onClick={() => setShowDeleteDialog(true)}
              className="delete-button"
              title="Delete property"
            >
              ×
            </button>
          </div>
        )}
      </div>
      
      {isExpanded && hasChildren && depth < config.maxDepth && (
        <StateTree
          data={value}
          onValueChange={onValueChange}
          onAddProperty={onAddProperty}
          onDeleteProperty={onDeleteProperty}
          config={config}
          parentPath={path}
          depth={depth + 1}
        />
      )}
      
      <AddPropertyDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAddProperty={handleAddProperty}
        existingKeys={canAddProperties ? Object.keys(value) : []}
        isArray={Array.isArray(value)}
      />
      
      <DeletePropertyDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirmDelete={handleDeleteProperty}
        propertyPath={path}
        propertyValue={value}
      />
      
      <style jsx>{`
        .state-node {
          margin: 2px 0;
          position: relative;
        }
        
        .state-node::before {
          content: '';
          position: absolute;
          left: ${depth * 20 - 8}px;
          top: 10px;
          width: 12px;
          height: 1px;
          background: #e1e4e8;
          display: ${depth > 0 ? 'block' : 'none'};
        }
        
        .node-line {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 0;
          padding-left: ${depth * 20}px;
          min-height: 20px;
          position: relative;
        }
        
        .expand-button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 10px;
          color: #586069;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
        }
        
        .expand-button:hover {
          background: #f6f8fa;
        }
        
        .key-name {
          color: #6f42c1;
          font-weight: 500;
          margin-right: 4px;
        }
        
        .value-type {
          color: #6a737d;
          font-size: 10px;
          margin-right: 4px;
        }
        
        .value-preview {
          color: ${getTypeColor(valueType)};
          cursor: ${config.readOnly ? 'default' : 'pointer'};
          padding: 1px 2px;
          border-radius: 2px;
          transition: background-color 0.2s;
        }
        
        .value-preview:hover {
          background: ${config.readOnly ? 'transparent' : '#f6f8fa'};
        }
        
        .edit-controls {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .edit-input {
          padding: 2px 4px;
          border: 1px solid #0366d6;
          border-radius: 2px;
          font-size: 11px;
          min-width: 100px;
        }
        
        .save-button,
        .cancel-button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 10px;
          width: 16px;
          height: 16px;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .save-button {
          color: #28a745;
        }
        
        .save-button:hover {
          background: #dcffe4;
        }
        
        .cancel-button {
          color: #d73a49;
        }
        
        .cancel-button:hover {
          background: #ffeaea;
        }
        
        .action-buttons {
          display: flex;
          gap: 2px;
          margin-left: 4px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        
        .state-node:hover .action-buttons {
          opacity: 1;
        }
        
        .add-button,
        .delete-button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 10px;
          width: 14px;
          height: 14px;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        
        .add-button {
          color: #28a745;
        }
        
        .add-button:hover {
          background: #dcffe4;
        }
        
        .delete-button {
          color: #d73a49;
        }
        
        .delete-button:hover {
          background: #ffeaea;
        }
      `}</style>
    </div>
  );
};