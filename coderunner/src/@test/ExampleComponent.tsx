import React from 'react';

// Default export component
const App = () => {
  const [count, setCount] = React.useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Welcome to CodeRunner!
        </h1>
        
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-4">
            This component was built and rendered using the new /render endpoint.
          </p>
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-lg font-semibold text-gray-700">Count: {count}</p>
            <div className="mt-3 space-x-3">
              <button
                onClick={() => setCount(count + 1)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
              >
                Increment
              </button>
              <button
                onClick={() => setCount(count - 1)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
              >
                Decrement
              </button>
              <button
                onClick={() => setCount(0)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 text-center">
          <p>✨ Powered by React, esbuild, and Go</p>
        </div>
      </div>
    </div>
  );
};

// Named export component
export const MyComponent = () => {
  return (
    <div className="p-8 bg-yellow-100 min-h-screen">
      <h1 className="text-2xl font-bold text-yellow-800">
        This is MyComponent!
      </h1>
      <p className="text-yellow-700 mt-4">
        You can access this by visiting: /render/@test/ExampleComponent.tsx?component=MyComponent
      </p>
    </div>
  );
};

export default App;