export interface StateHistory {
  past: Record<string, any>[];
  present: Record<string, any>;
  future: Record<string, any>[];
}

export interface StateInspectorConfig {
  readOnly?: boolean;
  maxDepth?: number;
  showTypes?: boolean;
  enableHistory?: boolean;
  customRenderers?: Record<string, React.ComponentType<any>>;
  collapsedByDefault?: boolean;
  showArrayIndices?: boolean;
  expandedPaths?: Set<string>;
  onToggleExpanded?: (path: string[]) => void;
}

export interface StateInspectorProps {
  state: Record<string, any>;
  onStateChange?: (newState: Record<string, any>, path: string[]) => void;
  onAddProperty?: (path: string[], key: string, value: any) => void;
  onDeleteProperty?: (path: string[]) => void;
  config?: StateInspectorConfig;
  schema?: Record<string, any>;
  history?: StateHistory;
  onHistoryChange?: (history: StateHistory) => void;
}

export interface StateTreeProps {
  data: Record<string, any>;
  onValueChange?: (path: string[], value: any) => void;
  onAddProperty?: (path: string[], key: string, value: any) => void;
  onDeleteProperty?: (path: string[]) => void;
  config: Required<StateInspectorConfig>;
  parentPath?: string[];
  depth?: number;
}

export interface StateNodeProps {
  keyProp: string;
  value: any;
  path: string[];
  onValueChange?: (path: string[], value: any) => void;
  onAddProperty?: (path: string[], key: string, value: any) => void;
  onDeleteProperty?: (path: string[]) => void;
  config: Required<StateInspectorConfig>;
  depth: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export type StateValue = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined 
  | object 
  | any[];

export interface ValueEditorProps {
  value: StateValue;
  type: string;
  onSave: (newValue: any) => void;
  onCancel: () => void;
  isEditing: boolean;
}