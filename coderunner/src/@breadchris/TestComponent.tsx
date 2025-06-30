import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

const TestComponent = () => {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  return (
    <div className="p-8 max-w-lg mx-auto bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Test Component</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name:
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Count: {count}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCount(count + 1)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Increment
            </button>
            <button
              onClick={() => setCount(count - 1)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Decrement
            </button>
            <button
              onClick={() => setCount(0)}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Reset
            </button>
          </div>
        </div>

        {name && (
          <div className="p-4 bg-green-100 border border-green-400 rounded-md">
            <p className="text-green-700">
              Hello, {name}! You've clicked {count} times.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TestComponent />); 