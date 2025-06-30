// DaisyUI React Component Library
// Export all components and types

// Base types and utilities
export * from './types';
export * from './utils';

// Core components
export { default as Button } from './Button';
export * from './Button';

export { default as Card } from './Card';
export * from './Card';

export { default as Input } from './Input';
export * from './Input';

export { default as Textarea } from './Textarea';
export * from './Textarea';

export { default as Checkbox } from './Checkbox';
export * from './Checkbox';

export { Alert } from './Alert';
export * from './Alert';

// Demo showcase
export { default as DemoShowcase } from './DemoShowcase';
export * from './DemoShowcase';

// Component categories for easier imports
export const Actions = {
  Button,
};

export const DataDisplay = {
  Card,
  Alert,
};

export const DataInput = {
  Input,
  Textarea,
  Checkbox,
};

export const Feedback = {
  Alert,
};

// Re-export everything as DaisyUI namespace
import Button from './Button';
import Card from './Card';
import Input from './Input';
import Textarea from './Textarea';
import Checkbox from './Checkbox';
import {Alert} from './Alert';

export const DaisyUI = {
  Button,
  Card,
  Input,
  Textarea,
  Checkbox,
  Alert,
  
  // Grouped exports
  Actions: {
    Button,
  },
  
  DataDisplay: {
    Card,
    Alert,
  },
  
  DataInput: {
    Input,
    Textarea,
    Checkbox,
  },
  
  Feedback: {
    Alert,
  },
};

export default DaisyUI;