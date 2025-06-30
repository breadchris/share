import React from 'react';

interface DeletePropertyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  propertyPath: string[];
  propertyValue: any;
}

export const DeletePropertyDialog: React.FC<DeletePropertyDialogProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  propertyPath,
  propertyValue,
}) => {
  if (!isOpen) return null;

  const pathString = propertyPath.join('.');
  const valueType = Array.isArray(propertyValue) ? 'array' : typeof propertyValue;
  const isArray = Array.isArray(propertyValue);
  const isObject = propertyValue && typeof propertyValue === 'object' && !isArray;
  
  const getValuePreview = (): string => {
    if (propertyValue === null) return 'null';
    if (propertyValue === undefined) return 'undefined';
    if (typeof propertyValue === 'string') {
      return `"${propertyValue.length > 50 ? propertyValue.substring(0, 50) + '...' : propertyValue}"`;
    }
    if (typeof propertyValue === 'number' || typeof propertyValue === 'boolean') {
      return String(propertyValue);
    }
    if (isArray) {
      return `Array(${propertyValue.length})`;
    }
    if (isObject) {
      return `Object(${Object.keys(propertyValue).length})`;
    }
    return String(propertyValue);
  };

  const handleConfirm = () => {
    onConfirmDelete();
    onClose();
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <div className="dialog-header">
          <h3>Delete Property</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        
        <div className="dialog-content">
          <div className="warning-icon">⚠️</div>
          
          <p className="warning-message">
            Are you sure you want to delete this property?
          </p>
          
          <div className="property-info">
            <div className="info-row">
              <span className="label">Path:</span>
              <span className="value path">{pathString || '(root)'}</span>
            </div>
            <div className="info-row">
              <span className="label">Type:</span>
              <span className="value type">{valueType}</span>
            </div>
            <div className="info-row">
              <span className="label">Value:</span>
              <span className="value preview">{getValuePreview()}</span>
            </div>
          </div>
          
          {(isObject || isArray) && (
            <div className="nested-warning">
              <strong>Warning:</strong> This will also delete all nested properties and cannot be undone.
            </div>
          )}
          
          <div className="dialog-actions">
            <button onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button onClick={handleConfirm} className="delete-button">
              Delete
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .dialog {
          background: white;
          border-radius: 6px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow: hidden;
        }
        
        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #f6f8fa;
          border-bottom: 1px solid #e1e4e8;
        }
        
        .dialog-header h3 {
          margin: 0;
          font-size: 16px;
          color: #24292e;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #586069;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .close-button:hover {
          color: #24292e;
        }
        
        .dialog-content {
          padding: 20px;
          text-align: center;
        }
        
        .warning-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .warning-message {
          font-size: 16px;
          color: #24292e;
          margin-bottom: 20px;
        }
        
        .property-info {
          background: #f6f8fa;
          border: 1px solid #e1e4e8;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 16px;
          text-align: left;
        }
        
        .info-row {
          display: flex;
          margin-bottom: 8px;
        }
        
        .info-row:last-child {
          margin-bottom: 0;
        }
        
        .label {
          font-weight: 500;
          color: #586069;
          min-width: 60px;
          font-size: 12px;
        }
        
        .value {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 12px;
          flex: 1;
        }
        
        .path {
          color: #6f42c1;
        }
        
        .type {
          color: #005cc5;
        }
        
        .preview {
          color: #24292e;
          word-break: break-all;
        }
        
        .nested-warning {
          background: #fff5b4;
          border: 1px solid #d1d5da;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 20px;
          text-align: left;
          font-size: 12px;
          color: #735c0f;
        }
        
        .dialog-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        
        .cancel-button,
        .delete-button {
          padding: 6px 12px;
          border: 1px solid #d1d5da;
          border-radius: 3px;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .cancel-button {
          background: white;
          color: #586069;
        }
        
        .cancel-button:hover {
          background: #f6f8fa;
        }
        
        .delete-button {
          background: #d73a49;
          color: white;
          border-color: #d73a49;
        }
        
        .delete-button:hover {
          background: #cb2431;
        }
      `}</style>
    </div>
  );
};