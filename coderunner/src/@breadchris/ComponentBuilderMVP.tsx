import React, { useState } from 'react';

// Core data structures for MVP
interface PropType {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function';
  required: boolean;
  description?: string;
}

interface ComponentVariant {
  id: string;
  name: string;
  description: string;
  code: string;
  status: 'draft' | 'review' | 'approved';
  createdAt: Date;
}

interface Component {
  id: string;
  name: string;
  description: string;
  props: PropType[];
  variants: ComponentVariant[];
  tags: string[];
  status: 'draft' | 'review' | 'approved' | 'deprecated';
  createdAt: Date;
  usageCount: number;
  reviewComments: ReviewComment[];
}

interface Feature {
  id: string;
  name: string;
  description: string;
  components: Component[];
  status: 'draft' | 'in-progress' | 'completed';
}

interface Idea {
  id: string;
  name: string;
  description: string;
  features: Feature[];
  status: 'draft' | 'active' | 'completed';
  createdAt: Date;
}

interface ReviewComment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  type: 'feedback' | 'approval' | 'request-changes';
}

// Sample data for MVP demonstration
const sampleIdeas: Idea[] = [
  {
    id: '1',
    name: 'Recipe Sharing Platform',
    description: 'A platform for home cooks to share and discover recipes',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    features: [
      {
        id: 'f1',
        name: 'Recipe Management',
        description: 'Core recipe creation and editing functionality',
        status: 'in-progress',
        components: [
          {
            id: 'c1',
            name: 'RecipeCard',
            description: 'Display recipe information in a card format',
            props: [
              { name: 'title', type: 'string', required: true, description: 'Recipe title' },
              { name: 'cookTime', type: 'number', required: true, description: 'Cooking time in minutes' },
              { name: 'difficulty', type: 'string', required: false, description: 'Difficulty level' }
            ],
            variants: [
              {
                id: 'v1',
                name: 'compact',
                description: 'Compact version for recipe lists',
                code: `<div className="p-4 bg-white rounded-lg shadow border">
  <h3 className="font-semibold text-lg">{title}</h3>
  <p className="text-gray-600">{cookTime} min</p>
</div>`,
                status: 'approved',
                createdAt: new Date('2024-01-20')
              },
              {
                id: 'v2',
                name: 'detailed',
                description: 'Detailed version with full information',
                code: `<div className="p-6 bg-white rounded-xl shadow-lg border">
  <h2 className="text-2xl font-bold mb-2">{title}</h2>
  <div className="flex items-center gap-4 text-sm text-gray-600">
    <span>⏱️ {cookTime} min</span>
    <span>📊 {difficulty}</span>
  </div>
</div>`,
                status: 'review',
                createdAt: new Date('2024-01-22')
              }
            ],
            tags: ['recipe', 'card', 'display'],
            status: 'approved',
            createdAt: new Date('2024-01-18'),
            usageCount: 24,
            reviewComments: [
              {
                id: 'r1',
                author: 'Sarah Chen',
                content: 'Great component! The compact variant works perfectly in our recipe lists.',
                timestamp: new Date('2024-01-21'),
                type: 'approval'
              }
            ]
          }
        ]
      }
    ]
  }
];

export const ComponentBuilderMVP: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>(sampleIdeas);
  const [currentView, setCurrentView] = useState<'dashboard' | 'idea-creator' | 'component-creator' | 'library'>('dashboard');
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  // New idea creation state
  const [newIdea, setNewIdea] = useState({ name: '', description: '' });
  const [newFeature, setNewFeature] = useState({ name: '', description: '' });
  const [newComponent, setNewComponent] = useState({
    name: '',
    description: '',
    props: [] as PropType[],
    tags: [] as string[]
  });
  const [newProp, setNewProp] = useState({ name: '', type: 'string' as PropType['type'], required: true, description: '' });

  // Helper functions
  const createIdea = () => {
    if (!newIdea.name.trim()) return;
    
    const idea: Idea = {
      id: Date.now().toString(),
      name: newIdea.name,
      description: newIdea.description,
      features: [],
      status: 'draft',
      createdAt: new Date()
    };
    
    setIdeas([...ideas, idea]);
    setNewIdea({ name: '', description: '' });
    setCurrentView('dashboard');
  };

  const addFeature = (ideaId: string) => {
    if (!newFeature.name.trim()) return;
    
    setIdeas(ideas.map(idea => 
      idea.id === ideaId 
        ? {
            ...idea,
            features: [
              ...idea.features,
              {
                id: Date.now().toString(),
                name: newFeature.name,
                description: newFeature.description,
                components: [],
                status: 'draft'
              }
            ]
          }
        : idea
    ));
    setNewFeature({ name: '', description: '' });
  };

  const addPropToComponent = () => {
    if (!newProp.name.trim()) return;
    
    setNewComponent({
      ...newComponent,
      props: [...newComponent.props, { ...newProp }]
    });
    setNewProp({ name: '', type: 'string', required: true, description: '' });
  };

  const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      deprecated: 'bg-red-100 text-red-800'
    };
    
    const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';
    
    return (
      <span className={`${sizeClasses} font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        {status}
      </span>
    );
  };

  // Dashboard View
  const DashboardView: React.FC = () => (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-2">Component Builder MVP</h1>
        <p className="text-blue-100 mb-4">Transform ideas into reusable components</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 p-3 rounded-lg">
            <div className="text-2xl font-bold">{ideas.length}</div>
            <div className="text-sm text-blue-100">Ideas</div>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <div className="text-2xl font-bold">
              {ideas.reduce((acc, idea) => acc + idea.features.length, 0)}
            </div>
            <div className="text-sm text-blue-100">Features</div>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <div className="text-2xl font-bold">
              {ideas.reduce((acc, idea) => 
                acc + idea.features.reduce((fAcc, feature) => fAcc + feature.components.length, 0), 0)}
            </div>
            <div className="text-sm text-blue-100">Components</div>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <div className="text-2xl font-bold">
              {ideas.reduce((acc, idea) => 
                acc + idea.features.reduce((fAcc, feature) => 
                  fAcc + feature.components.reduce((cAcc, component) => 
                    cAcc + component.variants.length, 0), 0), 0)}
            </div>
            <div className="text-sm text-blue-100">Variants</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setCurrentView('idea-creator')}
          className="p-6 bg-white rounded-lg shadow border hover:shadow-md transition-shadow text-left"
        >
          <div className="text-2xl mb-2">💡</div>
          <h3 className="font-semibold text-lg">Create New Idea</h3>
          <p className="text-gray-600 text-sm">Start with a business concept</p>
        </button>
        
        <button
          onClick={() => setCurrentView('component-creator')}
          className="p-6 bg-white rounded-lg shadow border hover:shadow-md transition-shadow text-left"
        >
          <div className="text-2xl mb-2">🧱</div>
          <h3 className="font-semibold text-lg">Build Component</h3>
          <p className="text-gray-600 text-sm">Create reusable UI components</p>
        </button>
        
        <button
          onClick={() => setCurrentView('library')}
          className="p-6 bg-white rounded-lg shadow border hover:shadow-md transition-shadow text-left"
        >
          <div className="text-2xl mb-2">📚</div>
          <h3 className="font-semibold text-lg">Browse Library</h3>
          <p className="text-gray-600 text-sm">Explore existing components</p>
        </button>
      </div>

      {/* Recent Ideas */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Ideas</h2>
        </div>
        <div className="divide-y">
          {ideas.slice(0, 5).map((idea) => (
            <div 
              key={idea.id} 
              className="p-6 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedIdea(idea)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{idea.name}</h3>
                <StatusBadge status={idea.status} />
              </div>
              <p className="text-gray-600 mb-3">{idea.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{idea.features.length} features</span>
                <span>•</span>
                <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Idea Creator View
  const IdeaCreatorView: React.FC = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-2xl font-bold mb-6">Create New Idea</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Idea Name *
            </label>
            <input
              type="text"
              value={newIdea.name}
              onChange={(e) => setNewIdea({ ...newIdea, name: e.target.value })}
              placeholder="e.g., Recipe Sharing Platform"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={newIdea.description}
              onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
              placeholder="Describe your business idea..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={createIdea}
              disabled={!newIdea.name.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Create Idea
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Component Creator View
  const ComponentCreatorView: React.FC = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-2xl font-bold mb-6">Create Component</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Component Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Component Name *
              </label>
              <input
                type="text"
                value={newComponent.name}
                onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                placeholder="e.g., RecipeCard"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newComponent.description}
                onChange={(e) => setNewComponent({ ...newComponent, description: e.target.value })}
                placeholder="Describe what this component does..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Props Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Props
              </label>
              <div className="space-y-3">
                {newComponent.props.map((prop, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-sm">{prop.name}</span>
                        <span className="text-gray-500 ml-2">({prop.type})</span>
                        {prop.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <button
                        onClick={() => setNewComponent({
                          ...newComponent,
                          props: newComponent.props.filter((_, i) => i !== index)
                        })}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                    {prop.description && (
                      <p className="text-sm text-gray-600 mt-1">{prop.description}</p>
                    )}
                  </div>
                ))}
                
                {/* Add Prop Form */}
                <div className="border-2 border-dashed border-gray-300 p-4 rounded">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Prop name"
                      value={newProp.name}
                      onChange={(e) => setNewProp({ ...newProp, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <select
                      value={newProp.type}
                      onChange={(e) => setNewProp({ ...newProp, type: e.target.value as PropType['type'] })}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                      <option value="object">object</option>
                      <option value="array">array</option>
                      <option value="function">function</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newProp.description}
                    onChange={(e) => setNewProp({ ...newProp, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-3"
                  />
                  <div className="flex justify-between">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={newProp.required}
                        onChange={(e) => setNewProp({ ...newProp, required: e.target.checked })}
                        className="mr-2"
                      />
                      Required
                    </label>
                    <button
                      onClick={addPropToComponent}
                      disabled={!newProp.name.trim()}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
                    >
                      Add Prop
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Code Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generated Interface
            </label>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto">
              <pre>
{`interface ${newComponent.name}Props {
${newComponent.props.map(prop => 
  `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};${prop.description ? ` // ${prop.description}` : ''}`
).join('\n')}
}

const ${newComponent.name}: React.FC<${newComponent.name}Props> = ({ 
${newComponent.props.map(prop => `  ${prop.name}`).join(',\n')}
}) => {
  return (
    <div>
      {/* Component implementation */}
    </div>
  );
};`}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            disabled={!newComponent.name.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Create Component
          </button>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Component Library View
  const ComponentLibraryView: React.FC = () => {
    const allComponents = ideas.flatMap(idea => 
      idea.features.flatMap(feature => feature.components)
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Component Library</h2>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Search components..."
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
              Filter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allComponents.map((component) => (
            <div 
              key={component.id}
              className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedComponent(component)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{component.name}</h3>
                <StatusBadge status={component.status} />
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{component.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Props:</span>
                  <span className="font-medium">{component.props.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Variants:</span>
                  <span className="font-medium">{component.variants.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Usage:</span>
                  <span className="font-medium">{component.usageCount}x</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {component.tags.map((tag) => (
                  <span key={tag} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="text-xl font-bold text-gray-900 hover:text-blue-600"
            >
              Component Builder MVP
            </button>
            <div className="flex space-x-4">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-2 rounded ${currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setCurrentView('library')}
                className={`px-3 py-2 rounded ${currentView === 'library' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Library
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'idea-creator' && <IdeaCreatorView />}
        {currentView === 'component-creator' && <ComponentCreatorView />}
        {currentView === 'library' && <ComponentLibraryView />}
      </main>

      {/* Component Detail Panel */}
      {selectedComponent && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l z-50 overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Component Details</h3>
              <button 
                onClick={() => setSelectedComponent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{selectedComponent.name}</h4>
                  <StatusBadge status={selectedComponent.status} />
                </div>
                <p className="text-gray-600 text-sm">{selectedComponent.description}</p>
              </div>

              <div>
                <h5 className="font-medium mb-2">Props ({selectedComponent.props.length})</h5>
                <div className="space-y-2">
                  {selectedComponent.props.map((prop, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border">
                      <div className="flex justify-between">
                        <span className="font-mono text-sm">{prop.name}</span>
                        <span className="text-xs text-gray-500">{prop.type}</span>
                      </div>
                      {prop.description && (
                        <p className="text-xs text-gray-600 mt-1">{prop.description}</p>
                      )}
                      {prop.required && (
                        <span className="text-xs text-red-500">Required</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-2">Variants ({selectedComponent.variants.length})</h5>
                <div className="space-y-2">
                  {selectedComponent.variants.map((variant) => (
                    <div key={variant.id} className="bg-gray-50 p-3 rounded border">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">{variant.name}</span>
                        <StatusBadge status={variant.status} size="sm" />
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{variant.description}</p>
                      <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                        {variant.code}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-2">Usage Analytics</h5>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-2xl font-bold text-blue-600">{selectedComponent.usageCount}</div>
                  <div className="text-sm text-gray-600">Times used across projects</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentBuilderMVP;