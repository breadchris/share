import React, { useState } from 'react';
import { inferValueType } from './utils';

interface AddPropertyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProperty: (key: string, value: any, type: string) => void;
  existingKeys: string[];
  isArray?: boolean;
}

export const AddPropertyDialog: React.FC<AddPropertyDialogProps> = ({
  isOpen,
  onClose,
  onAddProperty,
  existingKeys,
  isArray = false,
}) => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [valueType, setValueType] = useState<string>('string');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!key && !isArray) {
      alert('Key is required');
      return;
    }
    
    if (!isArray && existingKeys.includes(key)) {
      alert('Key already exists');
      return;
    }

    let parsedValue: any;
    
    try {
      switch (valueType) {
        case 'string':
          parsedValue = value;
          break;
        case 'number':
          parsedValue = parseFloat(value);
          if (isNaN(parsedValue)) throw new Error('Invalid number');
          break;
        case 'boolean':
          parsedValue = value.toLowerCase() === 'true';
          break;
        case 'null':
          parsedValue = null;
          break;
        case 'undefined':
          parsedValue = undefined;
          break;
        case 'array':
          parsedValue = value ? JSON.parse(value) : [];
          break;
        case 'object':
          parsedValue = value ? JSON.parse(value) : {};
          break;
        case 'auto':
          const inferred = inferValueType(value);
          parsedValue = inferred.parsedValue;
          break;
        default:
          parsedValue = value;
      }
    } catch (error) {
      alert('Invalid value format');
      return;
    }

    const finalKey = isArray ? existingKeys.length.toString() : key;
    onAddProperty(finalKey, parsedValue, valueType);
    
    // Reset form
    setKey('');
    setValue('');
    setValueType('string');
    onClose();
  };

  const handleCancel = () => {
    setKey('');
    setValue('');
    setValueType('string');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <div className="dialog-header">
          <h3>Add {isArray ? 'Array Item' : 'Property'}</h3>
          <button onClick={handleCancel} className="close-button">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="dialog-content">
          {!isArray && (
            <div className="form-group">
              <label htmlFor="key">Property Key:</label>
              <input
                id="key"
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter property key"
                autoFocus
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="valueType">Value Type:</label>
            <select
              id="valueType"
              value={valueType}
              onChange={(e) => setValueType(e.target.value)}
            >
              <option value="auto">Auto-detect</option>
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="null">Null</option>
              <option value="undefined">Undefined</option>
              <option value="object">Object</option>
              <option value="array">Array</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="value">Value:</label>
            {valueType === 'boolean' ? (
              <select
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              >
                <option value="">Select...</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : valueType === 'null' || valueType === 'undefined' ? (
              <input
                id="value"
                type="text"
                value={valueType}
                disabled
                className="disabled-input"
              />
            ) : (valueType === 'object' || valueType === 'array') ? (
              <textarea
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={valueType === 'object' ? '{"key": "value"}' : '[1, 2, 3]'}
                rows={3}
              />
            ) : (
              <input
                id="value"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  valueType === 'string' ? 'Enter string value' :
                  valueType === 'number' ? 'Enter number' :
                  valueType === 'auto' ? 'Enter value (type will be auto-detected)' :
                  'Enter value'
                }
              />
            )}
          </div>
          
          <div className="dialog-actions">
            <button type="button" onClick={handleCancel} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="add-button">
              Add {isArray ? 'Item' : 'Property'}
            </button>
          </div>
        </form>
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
          max-width: 400px;
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
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-size: 12px;
          font-weight: 500;
          color: #24292e;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #d1d5da;
          border-radius: 3px;
          font-size: 12px;
          font-family: inherit;
          box-sizing: border-box;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #0366d6;
          outline: none;
          box-shadow: 0 0 0 2px rgba(3, 102, 214, 0.1);
        }
        
        .disabled-input {
          background: #f6f8fa;
          color: #6a737d;
        }
        
        .form-group textarea {
          resize: vertical;
          min-height: 60px;
        }
        
        .dialog-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        .cancel-button,
        .add-button {
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
        
        .add-button {
          background: #0366d6;
          color: white;
          border-color: #0366d6;
        }
        
        .add-button:hover {
          background: #0256cc;
        }
      `}</style>
    </div>
  );
};