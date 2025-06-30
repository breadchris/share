export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
}

export function setValueAtPath(obj: any, path: string[], value: any): any {
  if (path.length === 0) {
    return value;
  }
  
  const cloned = deepClone(obj);
  let current = cloned;
  
  // Navigate to the parent of the target property
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (current[key] === null || typeof current[key] !== 'object') {
      // Create object or array based on the next key
      const nextKey = path[i + 1];
      current[key] = /^\d+$/.test(nextKey) ? [] : {};
    }
    current = current[key];
  }
  
  // Set the new value
  const finalKey = path[path.length - 1];
  current[finalKey] = value;
  
  return cloned;
}

export function deleteValueAtPath(obj: any, path: string[]): any {
  if (path.length === 0) {
    return obj;
  }
  
  const cloned = deepClone(obj);
  let current = cloned;
  
  // Navigate to the parent of the target property
  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]];
    if (!current) {
      return cloned; // Path doesn't exist
    }
  }
  
  const finalKey = path[path.length - 1];
  
  if (Array.isArray(current)) {
    const index = parseInt(finalKey, 10);
    if (!isNaN(index) && index >= 0 && index < current.length) {
      current.splice(index, 1);
    }
  } else if (typeof current === 'object' && current !== null) {
    delete current[finalKey];
  }
  
  return cloned;
}

export function getValueAtPath(obj: any, path: string[]): any {
  let current = obj;
  for (const key of path) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

export function isValidPath(obj: any, path: string[]): boolean {
  let current = obj;
  for (const key of path) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return false;
    }
    if (!(key in current)) {
      return false;
    }
    current = current[key];
  }
  return true;
}

export function generateUniqueKey(obj: any, prefix: string = 'newProperty'): string {
  if (!obj || typeof obj !== 'object') {
    return prefix;
  }
  
  let counter = 1;
  let newKey = prefix;
  
  while (newKey in obj) {
    newKey = `${prefix}${counter}`;
    counter++;
  }
  
  return newKey;
}

export function inferValueType(value: string): { type: string; parsedValue: any } {
  // Try to infer the type from the string value
  if (value === 'true' || value === 'false') {
    return { type: 'boolean', parsedValue: value === 'true' };
  }
  
  if (value === 'null') {
    return { type: 'null', parsedValue: null };
  }
  
  if (value === 'undefined') {
    return { type: 'undefined', parsedValue: undefined };
  }
  
  // Try to parse as number
  const numberValue = Number(value);
  if (!isNaN(numberValue) && value.trim() !== '') {
    return { type: 'number', parsedValue: numberValue };
  }
  
  // Try to parse as JSON (for objects/arrays)
  try {
    const jsonValue = JSON.parse(value);
    if (Array.isArray(jsonValue)) {
      return { type: 'array', parsedValue: jsonValue };
    }
    if (typeof jsonValue === 'object' && jsonValue !== null) {
      return { type: 'object', parsedValue: jsonValue };
    }
  } catch {
    // Not valid JSON, treat as string
  }
  
  return { type: 'string', parsedValue: value };
}

export function pathToString(path: string[]): string {
  return path.join('.');
}

export function stringToPath(pathString: string): string[] {
  return pathString ? pathString.split('.') : [];
}