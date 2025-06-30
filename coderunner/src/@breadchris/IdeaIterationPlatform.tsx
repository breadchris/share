import React, { useState } from 'react';

// Types for the platform
interface Idea {
  id: string;
  name: string;
  description: string;
  features: Feature[];
  status: 'draft' | 'in-progress' | 'completed';
}

interface Feature {
  id: string;
  name: string;
  description: string;
  components: Component[];
  status: 'draft' | 'in-progress' | 'completed';
}

interface Component {
  id: string;
  name: string;
  description: string;
  variants: Variant[];
  status: 'draft' | 'reviewed' | 'approved' | 'deprecated';
  props?: Record<string, string>;
}

interface Variant {
  id: string;
  name: string;
  description: string;
  code: string;
  status: 'draft' | 'reviewed' | 'approved';
}

// Sample data
const sampleIdea: Idea = {
  id: '1',
  name: 'Recipe Site',
  description: 'A platform for sharing and discovering recipes',
  status: 'in-progress',
  features: [
    {
      id: 'f1',
      name: 'Recipe Submission',
      description: 'Allow users to submit their own recipes',
      status: 'in-progress',
      components: [
        {
          id: 'c1',
          name: 'RecipeCard',
          description: 'Display recipe information in a card format',
          status: 'approved',
          props: { title: 'string', description: 'string', cookTime: 'number' },
          variants: [
            {
              id: 'v1',
              name: 'compact',
              description: 'Compact version for lists',
              code: '<div className="p-4 border rounded">...</div>',
              status: 'approved'
            },
            {
              id: 'v2', 
              name: 'detailed',
              description: 'Detailed version with full info',
              code: '<div className="p-6 bg-white shadow-lg">...</div>',
              status: 'reviewed'
            }
          ]
        }
      ]
    },
    {
      id: 'f2',
      name: 'Meal Planner',
      description: 'Plan weekly meals',
      status: 'draft',
      components: []
    }
  ]
};

export const IdeaIterationPlatform: React.FC = () => {
  const [currentIdea, setCurrentIdea] = useState<Idea>(sampleIdea);
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'components'>('overview');
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      reviewed: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      deprecated: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        {status}
      </span>
    );
  };

  const IdeaOverview: React.FC = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{currentIdea.name}</h2>
          <StatusBadge status={currentIdea.status} />
        </div>
        <p className="text-gray-600 mb-4">{currentIdea.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Features</h3>
            <p className="text-2xl font-bold text-blue-700">{currentIdea.features.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900">Components</h3>
            <p className="text-2xl font-bold text-purple-700">
              {currentIdea.features.reduce((acc, f) => acc + f.components.length, 0)}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Variants</h3>
            <p className="text-2xl font-bold text-green-700">
              {currentIdea.features.reduce((acc, f) => 
                acc + f.components.reduce((cacc, c) => cacc + c.variants.length, 0), 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Progression Flow</h3>
        <div className="flex items-center space-x-4 overflow-x-auto">
          <div className="flex-shrink-0 text-center">
            <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <p className="text-sm mt-2">Idea</p>
          </div>
          <div className="w-8 h-0.5 bg-gray-300"></div>
          <div className="flex-shrink-0 text-center">
            <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <p className="text-sm mt-2">Features</p>
          </div>
          <div className="w-8 h-0.5 bg-gray-300"></div>
          <div className="flex-shrink-0 text-center">
            <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <p className="text-sm mt-2">Components</p>
          </div>
          <div className="w-8 h-0.5 bg-gray-300"></div>
          <div className="flex-shrink-0 text-center">
            <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
            <p className="text-sm mt-2">Variants</p>
          </div>
        </div>
      </div>
    </div>
  );

  const FeaturesView: React.FC = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Features</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          Add Feature
        </button>
      </div>
      
      <div className="grid gap-4">
        {currentIdea.features.map((feature) => (
          <div 
            key={feature.id} 
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedFeature(feature)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{feature.name}</h3>
              <StatusBadge status={feature.status} />
            </div>
            <p className="text-gray-600 mb-3">{feature.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{feature.components.length} components</span>
              <span>•</span>
              <span>{feature.components.reduce((acc, c) => acc + c.variants.length, 0)} variants</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ComponentsView: React.FC = () => {
    const allComponents = currentIdea.features.flatMap(f => f.components);
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Components</h2>
          <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors">
            Create Component
          </button>
        </div>
        
        <div className="grid gap-4">
          {allComponents.map((component) => (
            <div 
              key={component.id}
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedComponent(component)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{component.name}</h3>
                <StatusBadge status={component.status} />
              </div>
              <p className="text-gray-600 mb-3">{component.description}</p>
              
              {component.props && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Props:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(component.props).map(([key, type]) => (
                      <span key={key} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {key}: {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{component.variants.length} variants</span>
                <div className="flex space-x-2">
                  {component.variants.map((variant) => (
                    <span key={variant.id} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                      {variant.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Idea Iteration Platform</h1>
          <p className="text-gray-600">From Sketch to System: A Playground for Idea Evolution</p>
        </div>

        {/* Navigation */}
        <div className="flex space-x-1 mb-6 bg-white p-1 rounded-lg shadow-sm border">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'features', label: 'Features' },
            { key: 'components', label: 'Components' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && <IdeaOverview />}
          {activeTab === 'features' && <FeaturesView />}
          {activeTab === 'components' && <ComponentsView />}
        </div>

        {/* Side Panel for Selected Items */}
        {(selectedFeature || selectedComponent) && (
          <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l z-50 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedFeature ? 'Feature Details' : 'Component Details'}
              </h3>
              <button 
                onClick={() => {
                  setSelectedFeature(null);
                  setSelectedComponent(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {selectedFeature && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">{selectedFeature.name}</h4>
                  <StatusBadge status={selectedFeature.status} />
                </div>
                <p className="text-gray-600">{selectedFeature.description}</p>
                
                <div>
                  <h5 className="font-medium mb-2">Components ({selectedFeature.components.length})</h5>
                  <div className="space-y-2">
                    {selectedFeature.components.map((comp) => (
                      <div key={comp.id} className="p-3 bg-gray-50 rounded border">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{comp.name}</span>
                          <StatusBadge status={comp.status} />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{comp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedComponent && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">{selectedComponent.name}</h4>
                  <StatusBadge status={selectedComponent.status} />
                </div>
                <p className="text-gray-600">{selectedComponent.description}</p>
                
                {selectedComponent.props && (
                  <div>
                    <h5 className="font-medium mb-2">Props</h5>
                    <div className="space-y-1">
                      {Object.entries(selectedComponent.props).map(([key, type]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="font-mono">{key}</span>
                          <span className="text-gray-500">{type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h5 className="font-medium mb-2">Variants ({selectedComponent.variants.length})</h5>
                  <div className="space-y-3">
                    {selectedComponent.variants.map((variant) => (
                      <div key={variant.id} className="p-3 bg-gray-50 rounded border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{variant.name}</span>
                          <StatusBadge status={variant.status} />
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{variant.description}</p>
                        <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                          {variant.code}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeaIterationPlatform;