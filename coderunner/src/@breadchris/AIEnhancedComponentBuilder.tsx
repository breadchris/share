import React, { useState, useCallback } from 'react';

// Enhanced data structures with AI and collaboration features
interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  type: 'comment' | 'suggestion' | 'approval' | 'rejection';
  parentId?: string; // For threading
}

interface EditHistory {
  id: string;
  field: string;
  oldValue: string;
  newValue: string;
  author: string;
  timestamp: Date;
}

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
  updatedAt: Date;
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
  updatedAt: Date;
  usageCount: number;
  reviewComments: Comment[];
  editHistory: EditHistory[];
}

interface FeatureRequest {
  id: string;
  name: string;
  description: string;
  aiGenerated: boolean;
  priority: 'low' | 'medium' | 'high';
  effort: 'small' | 'medium' | 'large';
  status: 'draft' | 'review' | 'approved' | 'in-development' | 'completed';
  comments: Comment[];
  assignee?: string;
  suggestedComponents: string[];
  associatedComponents: Component[];
  createdAt: Date;
  updatedAt: Date;
  editHistory: EditHistory[];
  estimatedHours?: number;
  tags: string[];
}

interface Feature {
  id: string;
  name: string;
  description: string;
  components: Component[];
  status: 'draft' | 'in-progress' | 'completed';
  featureRequests: FeatureRequest[];
  createdAt: Date;
  updatedAt: Date;
}

interface Idea {
  id: string;
  name: string;
  description: string;
  features: Feature[];
  status: 'draft' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  aiEnhanced: boolean;
  totalFeatureRequests: number;
}

// Real AI Service using /ai endpoint
class AIApiService {
  static async generateFeatures(ideaName: string, ideaDescription: string): Promise<FeatureRequest[]> {
    try {
      // Create a sample feature request for schema generation
      const sampleFeatureRequest: FeatureRequest = {
        id: "sample-id",
        name: "Sample Feature Name",
        description: "Detailed description of the feature functionality",
        aiGenerated: true,
        priority: "medium",
        effort: "medium",
        status: "draft",
        comments: [],
        suggestedComponents: [],
        associatedComponents: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        editHistory: [],
        estimatedHours: 30,
        tags: ["example-tag"],
        assignee: undefined
      };

      const req = {
        features: [sampleFeatureRequest]
      }

      const response = await fetch('/ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: `You are a product manager and software architect helping to break down software ideas into specific, actionable feature requests. 

For each feature request, provide:
- A clear, specific name
- Detailed description explaining what the feature does and how users interact with it
- Appropriate priority (high/medium/low) based on core functionality
- Effort estimation (small/medium/large)
- Realistic estimated hours
- Relevant tags for categorization
- Suggested components that might be needed

Generate 3-5 feature requests that cover the core functionality needed for this idea.`,
          userMessage: `Analyze this software idea and generate specific feature requests:

Idea Name: ${ideaName}
Description: ${ideaDescription}

Please provide a structured response with 3-5 feature requests that would be needed to build this idea.`,
          generateSchema: req // Generate schema for array of feature requests
        })
      });

      if (!response.ok) {
        throw new Error(`AI API responded with status: ${response.status}`);
      }

      const result = await response.json();
      
      // Check if AI response exists
      if (!result.aiResponse) {
        throw new Error('AI API did not return a valid response');
      }
      
      // Extract the AI response and process it
      let aiFeatures = result.aiResponse;
      
      // If the response is a string, try to parse it as JSON
      if (typeof aiFeatures === 'string') {
        try {
          aiFeatures = JSON.parse(aiFeatures);
        } catch {
          throw new Error('AI returned invalid JSON response');
        }
      }

      // Ensure we have an array
      if (!Array.isArray(aiFeatures.features)) {
        throw new Error('AI response is not an array of features');
      }

      // Process and standardize the features
      return aiFeatures.features.map((feature: any, index: number) => ({
        id: `ai-feature-${Date.now()}-${index}`,
        name: feature.name || `Feature ${index + 1}`,
        description: feature.description || 'AI-generated feature description',
        aiGenerated: true,
        priority: feature.priority || 'medium',
        effort: feature.effort || 'medium',
        status: 'draft' as const,
        comments: [],
        suggestedComponents: feature.suggestedComponents || [],
        associatedComponents: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        editHistory: [],
        estimatedHours: feature.estimatedHours || 30,
        tags: feature.tags || ['ai-generated'],
        assignee: undefined
      }));

    } catch (error) {
      console.error('Failed to generate features with AI:', error);
      throw new Error('Failed to generate features. Please try again.');
    }
  }

  static async suggestComponents(featureDescription: string): Promise<string[]> {
    try {
      const response = await fetch('/ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: "You are a React component architect. Suggest 3-5 specific React component names that would be needed to implement the given feature. Focus on reusable, well-named components.",
          userMessage: `What React components would be needed to implement this feature: ${featureDescription}`,
          generateSchema: ["ComponentName1", "ComponentName2", "ComponentName3"]
        })
      });

      const result = await response.json();
      
      // Check if AI response exists
      if (!result.aiResponse) {
        console.warn('AI API did not return a valid response for component suggestions');
        return [];
      }
      
      let components = result.aiResponse;
      
      if (typeof components === 'string') {
        try {
          components = JSON.parse(components);
        } catch {
          // If parsing fails, split by common delimiters
          components = components.split(/[,\n]/).map((c: string) => c.trim()).filter(Boolean);
        }
      }

      return Array.isArray(components) ? components : [];
    } catch (error) {
      console.error('Failed to suggest components:', error);
      return [];
    }
  }

  static async enhanceFeature(feature: FeatureRequest): Promise<FeatureRequest> {
    try {
      const response = await fetch('/ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: "You are a product manager helping to enhance feature descriptions. Add more detail, user stories, and technical considerations while keeping the core functionality the same.",
          userMessage: `Enhance this feature description with more detail and user stories:

Name: ${feature.name}
Description: ${feature.description}
Priority: ${feature.priority}
Effort: ${feature.effort}`,
          generateSchema: {
            description: "Enhanced detailed description with user stories",
            tags: ["tag1", "tag2"],
            estimatedHours: 35
          }
        })
      });

      const result = await response.json();
      
      // Check if AI response exists
      if (!result.aiResponse) {
        console.warn('AI API did not return a valid response for feature enhancement');
        return feature; // Return original feature if enhancement fails
      }
      
      const enhancement = result.aiResponse;

      return {
        ...feature,
        description: enhancement.description || feature.description,
        tags: [...feature.tags, ...(enhancement.tags || []), 'ai-enhanced'],
        estimatedHours: enhancement.estimatedHours || feature.estimatedHours,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Failed to enhance feature:', error);
      return feature;
    }
  }

  static async generateComponentCode(feature: FeatureRequest): Promise<Array<{
    name: string;
    description: string;
    code: string;
    props?: PropType[];
    tags?: string[];
  }>> {
    try {
      const sampleComponent = {
        name: "SampleComponent",
        description: "A sample React component",
        code: "import React from 'react';\n\nexport const SampleComponent = () => {\n  return <div>Sample</div>;\n};",
        props: [
          { name: "className", type: "string", required: false, description: "CSS class name" }
        ],
        tags: ["react", "component"]
      };

      const req = {
        components:  [sampleComponent, sampleComponent]
      };

      const response = await fetch('/ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: `You are a senior React developer specializing in creating high-quality, reusable components. Generate 2-3 React components that would be needed to implement the given feature.

For each component, provide:
- A descriptive PascalCase name
- Clear description of functionality
- Complete React TypeScript code using modern React patterns (hooks, functional components)
- Proper prop definitions with TypeScript interfaces
- Styled with Tailwind CSS classes
- Include proper exports and imports
- Follow best practices for accessibility and performance

The components should be production-ready and follow these patterns:
- Use TypeScript interfaces for props
- Include proper JSDoc comments
- Use semantic HTML elements
- Include ARIA attributes where appropriate
- Handle edge cases and loading states`,
          userMessage: `Generate React components for this feature:

Feature Name: ${feature.name}
Description: ${feature.description}
Priority: ${feature.priority}
Effort: ${feature.effort}
Suggested Components: ${feature.suggestedComponents.join(', ')}

Please generate 2-3 complete React TypeScript components that would implement this feature.`,
          generateSchema: req
        })
      });

      if (!response.ok) {
        throw new Error(`AI API responded with status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.aiResponse) {
        throw new Error('AI API did not return a valid response');
      }

      let components = result.aiResponse;
      
      if (typeof components === 'string') {
        try {
          components = JSON.parse(components);
        } catch {
          throw new Error('AI returned invalid JSON response');
        }
      }

      if (!Array.isArray(components.components)) {
        throw new Error('AI response is not an array of components');
    }

      return components.components.map((comp: any, index: number) => ({
        name: comp.name || `Component${index + 1}`,
        description: comp.description || 'AI-generated component',
        code: comp.code || `import React from 'react';\n\nexport const ${comp.name || `Component${index + 1}`} = () => {\n  return <div>Generated component</div>;\n};`,
        props: comp.props || [],
        tags: comp.tags || ['ai-generated', 'react']
      }));

    } catch (error) {
      console.error('Failed to generate component code:', error);
      throw new Error('Failed to generate component code. Please try again.');
    }
  }
}

// Helper components defined outside to prevent re-creation
const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    'in-development': 'bg-purple-100 text-purple-800',
    deprecated: 'bg-red-100 text-red-800'
  };
  
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';
  
  return (
    <span className={`${sizeClasses} font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const colors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${colors[priority as keyof typeof colors]}`}>
      {priority}
    </span>
  );
};

const EffortBadge: React.FC<{ effort: string }> = ({ effort }) => {
  const colors = {
    small: 'bg-blue-100 text-blue-800',
    medium: 'bg-indigo-100 text-indigo-800',
    large: 'bg-purple-100 text-purple-800'
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${colors[effort as keyof typeof colors]}`}>
      {effort}
    </span>
  );
};

// Props interfaces for extracted components
interface IdeaWizardViewProps {
  wizardStep: 'basic-info' | 'ai-generation' | 'feature-review' | 'completion';
  setWizardStep: (step: 'basic-info' | 'ai-generation' | 'feature-review' | 'completion') => void;
  newIdea: { name: string; description: string };
  handleIdeaNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleIdeaDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  currentIdea: Partial<Idea>;
  isGenerating: boolean;
  generateFeaturesWithAI: () => Promise<void>;
  generatedFeatures: FeatureRequest[];
  setSelectedFeature: (feature: FeatureRequest | null) => void;
  completeIdeaCreation: () => void;
  setCurrentView: (view: 'dashboard' | 'idea-wizard' | 'feature-detail' | 'library') => void;
}

// Idea Creation Wizard Component (extracted to prevent remounting)
const IdeaWizardView: React.FC<IdeaWizardViewProps> = ({
  wizardStep,
  setWizardStep,
  newIdea,
  handleIdeaNameChange,
  handleIdeaDescriptionChange,
  currentIdea,
  isGenerating,
  generateFeaturesWithAI,
  generatedFeatures,
  setSelectedFeature,
  completeIdeaCreation,
  setCurrentView
}) => {
  const handleBasicInfoNext = useCallback(() => {
    if (newIdea.name.trim() && newIdea.description.trim()) {
      setWizardStep('ai-generation');
    }
  }, [newIdea.name, newIdea.description, setWizardStep]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Create New Idea</h2>
          <div className="text-sm text-gray-500">
            Step {wizardStep === 'basic-info' ? 1 : wizardStep === 'ai-generation' ? 2 : wizardStep === 'feature-review' ? 3 : 4} of 4
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: wizardStep === 'basic-info' ? '25%' : 
                     wizardStep === 'ai-generation' ? '50%' : 
                     wizardStep === 'feature-review' ? '75%' : '100%' 
            }}
          />
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {wizardStep === 'basic-info' && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Tell us about your idea</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Idea Name *
              </label>
              <input
                type="text"
                value={newIdea.name}
                onChange={handleIdeaNameChange}
                placeholder="e.g., Recipe Sharing Platform"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={newIdea.description}
                onChange={handleIdeaDescriptionChange}
                placeholder="Describe your business idea in detail. The more context you provide, the better AI can suggest relevant features..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleBasicInfoNext}
                disabled={!newIdea.name.trim() || !newIdea.description.trim()}
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Continue to AI Generation
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: AI Generation */}
      {wizardStep === 'ai-generation' && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Generate Features with AI</h3>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">{currentIdea.name}</h4>
              <p className="text-blue-700 text-sm">{currentIdea.description}</p>
            </div>

            <div className="text-center py-8">
              {!isGenerating ? (
                <div>
                  <div className="text-4xl mb-4">🤖</div>
                  <h4 className="text-lg font-medium mb-2">Ready to generate features</h4>
                  <p className="text-gray-600 mb-4">
                    Our AI will analyze your idea and suggest relevant features, components, and requirements.
                  </p>
                  <button
                    onClick={generateFeaturesWithAI}
                    className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
                  >
                    Generate Features with AI
                  </button>
                </div>
              ) : (
                <div>
                  <div className="animate-spin text-4xl mb-4">🤖</div>
                  <h4 className="text-lg font-medium mb-2">Generating features...</h4>
                  <p className="text-gray-600">AI is analyzing your idea and creating feature suggestions</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setWizardStep('basic-info')}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Feature Review */}
      {wizardStep === 'feature-review' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Review Generated Features</h3>
            <p className="text-gray-600 mb-4">
              AI has generated {generatedFeatures.length} feature suggestions. Review, edit, and customize them below.
            </p>
          </div>

          <div className="grid gap-6">
            {generatedFeatures.map((feature) => (
              <div key={feature.id} className="bg-white p-6 rounded-lg shadow border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-lg">{feature.name}</h4>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                        AI Generated
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{feature.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedFeature(feature)}
                    className="text-blue-500 hover:text-blue-700 text-sm"
                  >
                    Edit Details
                  </button>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Priority:</span>
                    <PriorityBadge priority={feature.priority} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Effort:</span>
                    <EffortBadge effort={feature.effort} />
                  </div>
                  {feature.estimatedHours && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Est. Hours:</span>
                      <span className="text-sm font-medium">{feature.estimatedHours}h</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {feature.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>

                {feature.comments.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      {feature.comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 p-3 rounded">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-sm">{comment.author}</span>
                            <span className="text-xs text-gray-500">
                              {comment.timestamp.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex space-x-3">
              <button
                onClick={() => setWizardStep('ai-generation')}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={completeIdeaCreation}
                className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600"
              >
                Create Idea with Features
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Quick Create View Component
interface QuickCreateViewProps {
  quickCreateIdea: { name: string; description: string };
  setQuickCreateIdea: React.Dispatch<React.SetStateAction<{ name: string; description: string }>>;
  quickCreateFeatures: FeatureRequest[];
  newFeatureName: string;
  setNewFeatureName: React.Dispatch<React.SetStateAction<string>>;
  addQuickFeature: () => void;
  updateQuickFeature: (featureId: string, updates: Partial<FeatureRequest>) => void;
  removeQuickFeature: (featureId: string) => void;
  saveQuickIdea: () => void;
  generateAISuggestions: () => Promise<void>;
  isGenerating: boolean;
  setCurrentView: (view: 'dashboard' | 'idea-wizard' | 'quick-create' | 'feature-detail' | 'library') => void;
}

const QuickCreateView: React.FC<QuickCreateViewProps> = ({
  quickCreateIdea, setQuickCreateIdea,
  quickCreateFeatures, 
  newFeatureName, setNewFeatureName,
  addQuickFeature, updateQuickFeature, removeQuickFeature,
  saveQuickIdea, generateAISuggestions,
  isGenerating, setCurrentView
}) => {

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Create New Idea</h2>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Idea Name *
            </label>
            <input
              type="text"
              value={quickCreateIdea.name}
              onChange={(e) => setQuickCreateIdea(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Recipe Sharing Platform"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={quickCreateIdea.description}
              onChange={(e) => setQuickCreateIdea(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of your idea..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Features</h3>
          {quickCreateIdea.name && quickCreateIdea.description && (
            <button
              onClick={generateAISuggestions}
              disabled={isGenerating}
              className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 disabled:bg-gray-300 text-sm"
            >
              {isGenerating ? '✨ Generating...' : '✨ AI Suggestions'}
            </button>
          )}
        </div>
        
        {/* Add Feature */}
        <div className="flex space-x-3 mb-4">
          <input
            type="text"
            value={newFeatureName}
            onChange={(e) => setNewFeatureName(e.target.value)}
            placeholder="Add a feature..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && addQuickFeature()}
          />
          <button
            onClick={addQuickFeature}
            disabled={!newFeatureName.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300"
          >
            Add
          </button>
        </div>

        {/* Feature List */}
        <div className="space-y-3">
          {quickCreateFeatures.map((feature) => (
            <div key={feature.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <input
                  type="text"
                  value={feature.name}
                  onChange={(e) => updateQuickFeature(feature.id, { name: e.target.value })}
                  className="font-medium text-lg border-none outline-none flex-1 mr-4"
                />
                <button
                  onClick={() => removeQuickFeature(feature.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
              
              <textarea
                value={feature.description}
                onChange={(e) => updateQuickFeature(feature.id, { description: e.target.value })}
                placeholder="Describe this feature..."
                rows={2}
                className="w-full text-sm text-gray-600 border border-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              
              <div className="flex items-center space-x-4 mt-3">
                <select
                  value={feature.priority}
                  onChange={(e) => updateQuickFeature(feature.id, { priority: e.target.value as any })}
                  className="text-xs border border-gray-200 rounded px-2 py-1"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                
                <select
                  value={feature.effort}
                  onChange={(e) => updateQuickFeature(feature.id, { effort: e.target.value as any })}
                  className="text-xs border border-gray-200 rounded px-2 py-1"
                >
                  <option value="small">Small Effort</option>
                  <option value="medium">Medium Effort</option>
                  <option value="large">Large Effort</option>
                </select>
                
                {feature.aiGenerated && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    AI Generated
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {quickCreateFeatures.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-2xl mb-2">🚀</div>
            <p>Add features to your idea manually or use AI suggestions</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={saveQuickIdea}
          disabled={!quickCreateIdea.name.trim()}
          className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-300"
        >
          Save Idea
        </button>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Idea Detail View Component
interface IdeaDetailViewProps {
  idea: Idea;
  setCurrentView: (view: 'dashboard' | 'idea-wizard' | 'quick-create' | 'feature-detail' | 'library' | 'idea-detail') => void;
  updateIdea: (ideaId: string, updates: Partial<Idea>) => void;
  updateFeature: (ideaId: string, featureId: string, updates: Partial<FeatureRequest>) => void;
  generateComponentsForFeature: (feature: FeatureRequest) => Promise<void>;
}

const IdeaDetailView: React.FC<IdeaDetailViewProps> = ({
  idea,
  setCurrentView,
  updateIdea,
  updateFeature,
  generateComponentsForFeature
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedIdea, setEditedIdea] = useState({ name: idea.name, description: idea.description });
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [isGeneratingComponents, setIsGeneratingComponents] = useState<Set<string>>(new Set());

  const allFeatures = idea.features.flatMap(f => f.featureRequests);
  const completedFeatures = allFeatures.filter(f => f.status === 'completed');
  const progressPercentage = allFeatures.length > 0 ? (completedFeatures.length / allFeatures.length) * 100 : 0;

  const handleSaveIdea = () => {
    updateIdea(idea.id, {
      name: editedIdea.name,
      description: editedIdea.description,
      updatedAt: new Date()
    });
    setEditMode(false);
  };

  const handleGenerateComponents = async (feature: FeatureRequest) => {
    setIsGeneratingComponents(prev => new Set(prev).add(feature.id));
    try {
      await generateComponentsForFeature(feature);
    } finally {
      setIsGeneratingComponents(prev => {
        const newSet = new Set(prev);
        newSet.delete(feature.id);
        return newSet;
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center space-x-3">
            {editMode ? (
              <>
                <button
                  onClick={handleSaveIdea}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Edit Idea
              </button>
            )}
          </div>
        </div>

        {editMode ? (
          <div className="space-y-4">
            <input
              type="text"
              value={editedIdea.name}
              onChange={(e) => setEditedIdea(prev => ({ ...prev, name: e.target.value }))}
              className="w-full text-2xl font-bold border-b border-gray-300 focus:border-blue-500 outline-none"
            />
            <textarea
              value={editedIdea.description}
              onChange={(e) => setEditedIdea(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full text-gray-600 border border-gray-300 rounded-md p-3 focus:border-blue-500 outline-none"
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold">{idea.name}</h1>
              {idea.aiEnhanced && (
                <span className="bg-blue-100 text-blue-700 text-sm px-2 py-1 rounded">
                  AI Enhanced
                </span>
              )}
              <StatusBadge status={idea.status} size="md" />
            </div>
            <p className="text-gray-600">{idea.description}</p>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">{allFeatures.length}</div>
          <div className="text-sm text-gray-600">Total Features</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">{completedFeatures.length}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-purple-600">
            {idea.features.reduce((acc, f) => acc + f.components.length, 0)}
          </div>
          <div className="text-sm text-gray-600">Components</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-orange-600">{Math.round(progressPercentage)}%</div>
          <div className="text-sm text-gray-600">Progress</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-3">Overall Progress</h3>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>{completedFeatures.length} completed</span>
          <span>{allFeatures.length - completedFeatures.length} remaining</span>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Features & Development</h3>
        
        {idea.features.map((featureGroup) => (
          <div key={featureGroup.id} className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">{featureGroup.name}</h4>
            <div className="space-y-3">
              {featureGroup.featureRequests.map((feature) => (
                <div key={feature.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h5 className="font-medium text-lg">{feature.name}</h5>
                      <p className="text-gray-600 text-sm mt-1">{feature.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <PriorityBadge priority={feature.priority} />
                      <EffortBadge effort={feature.effort} />
                      <StatusBadge status={feature.status} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {feature.estimatedHours && (
                        <span>{feature.estimatedHours}h estimated</span>
                      )}
                      <span>{feature.associatedComponents.length} components</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedFeatureId(feature.id === selectedFeatureId ? null : feature.id)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        {selectedFeatureId === feature.id ? 'Hide Details' : 'View Details'}
                      </button>
                      <button
                        onClick={() => handleGenerateComponents(feature)}
                        disabled={isGeneratingComponents.has(feature.id)}
                        className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 disabled:bg-gray-300"
                      >
                        {isGeneratingComponents.has(feature.id) ? '⚡ Generating...' : '⚡ Generate Components'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Feature Details */}
                  {selectedFeatureId === feature.id && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h6 className="font-medium mb-2">Suggested Components</h6>
                          <div className="space-y-1">
                            {feature.suggestedComponents.map((comp, idx) => (
                              <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                                {comp}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h6 className="font-medium mb-2">Tags</h6>
                          <div className="flex flex-wrap gap-1">
                            {feature.tags.map((tag, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {allFeatures.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-2xl mb-2">🚀</div>
            <p>No features yet. Create some features to start developing components.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const AIEnhancedComponentBuilder: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'idea-wizard' | 'quick-create' | 'feature-detail' | 'library' | 'idea-detail'>('dashboard');
  
  // Wizard state
  const [wizardStep, setWizardStep] = useState<'basic-info' | 'ai-generation' | 'feature-review' | 'completion'>('basic-info');
  const [currentIdea, setCurrentIdea] = useState<Partial<Idea>>({});
  const [generatedFeatures, setGeneratedFeatures] = useState<FeatureRequest[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureRequest | null>(null);
  
  // Form state
  const [newIdea, setNewIdea] = useState({ name: '', description: '' });
  const [newComment, setNewComment] = useState('');

  // Quick create state
  const [quickCreateIdea, setQuickCreateIdea] = useState({ name: '', description: '' });
  const [quickCreateFeatures, setQuickCreateFeatures] = useState<FeatureRequest[]>([]);
  const [newFeatureName, setNewFeatureName] = useState('');

  // AI Feature Generation
  const generateFeaturesWithAI = useCallback(async () => {
    if (!currentIdea.name || !currentIdea.description) return;
    
    setIsGenerating(true);
    try {
      const features = await AIApiService.generateFeatures(currentIdea.name, currentIdea.description);
      setGeneratedFeatures(features);
      setWizardStep('feature-review');
    } catch (error) {
      console.error('Failed to generate features:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [currentIdea.name, currentIdea.description]);

  // Create idea with generated features
  const completeIdeaCreation = useCallback(() => {
    const idea: Idea = {
      id: Date.now().toString(),
      name: currentIdea.name!,
      description: currentIdea.description!,
      features: [{
        id: `feature-${Date.now()}`,
        name: 'Generated Features',
        description: 'Features generated by AI',
        components: [],
        status: 'in-progress',
        featureRequests: generatedFeatures,
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      aiEnhanced: true,
      totalFeatureRequests: generatedFeatures.length
    };
    
    setIdeas([...ideas, idea]);
    setCurrentView('dashboard');
    setWizardStep('basic-info');
    setCurrentIdea({});
    setGeneratedFeatures([]);
  }, [currentIdea.name, currentIdea.description, generatedFeatures, ideas]);

  // Quick create functions
  const addQuickFeature = useCallback(() => {
    if (!newFeatureName.trim()) return;
    
    const newFeature: FeatureRequest = {
      id: `feature-${Date.now()}`,
      name: newFeatureName,
      description: 'Add description...',
      aiGenerated: false,
      priority: 'medium',
      effort: 'medium',
      status: 'draft',
      comments: [],
      suggestedComponents: [],
      associatedComponents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      editHistory: [],
      estimatedHours: 0,
      tags: [],
      assignee: undefined
    };
    
    setQuickCreateFeatures([...quickCreateFeatures, newFeature]);
    setNewFeatureName('');
  }, [newFeatureName, quickCreateFeatures]);

  const updateQuickFeature = useCallback((featureId: string, updates: Partial<FeatureRequest>) => {
    setQuickCreateFeatures(prev => 
      prev.map(feature => 
        feature.id === featureId ? { ...feature, ...updates, updatedAt: new Date() } : feature
      )
    );
  }, []);

  const removeQuickFeature = useCallback((featureId: string) => {
    setQuickCreateFeatures(prev => prev.filter(f => f.id !== featureId));
  }, []);

  const saveQuickIdea = useCallback(() => {
    if (!quickCreateIdea.name.trim()) return;

    const idea: Idea = {
      id: Date.now().toString(),
      name: quickCreateIdea.name,
      description: quickCreateIdea.description || 'No description provided',
      features: quickCreateFeatures.length > 0 ? [{
        id: `feature-group-${Date.now()}`,
        name: 'Core Features',
        description: 'Manually created features',
        components: [],
        status: 'draft',
        featureRequests: quickCreateFeatures,
        createdAt: new Date(),
        updatedAt: new Date()
      }] : [],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      aiEnhanced: false,
      totalFeatureRequests: quickCreateFeatures.length
    };

    setIdeas([...ideas, idea]);
    setCurrentView('dashboard');
    setQuickCreateIdea({ name: '', description: '' });
    setQuickCreateFeatures([]);
  }, [quickCreateIdea, quickCreateFeatures, ideas]);

  const generateAISuggestions = useCallback(async () => {
    if (!quickCreateIdea.name || !quickCreateIdea.description) return;
    
    setIsGenerating(true);
    try {
      const suggestions = await AIApiService.generateFeatures(quickCreateIdea.name, quickCreateIdea.description);
      // Add suggestions to the current features list
      setQuickCreateFeatures(prev => [...prev, ...suggestions]);
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [quickCreateIdea]);

  // Add comment to feature
  const addComment = useCallback((featureId: string) => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      author: 'Current User',
      content: newComment,
      timestamp: new Date(),
      type: 'comment'
    };

    setGeneratedFeatures(features => 
      features.map(feature => 
        feature.id === featureId 
          ? { ...feature, comments: [...feature.comments, comment] }
          : feature
      )
    );
    setNewComment('');
  }, [newComment]);

  // Update feature
  const updateFeature = useCallback((featureId: string, updates: Partial<FeatureRequest>) => {
    setGeneratedFeatures(features =>
      features.map(feature =>
        feature.id === featureId
          ? { ...feature, ...updates, updatedAt: new Date() }
          : feature
      )
    );
  }, []);

  // Idea Management Functions
  const updateIdea = useCallback((ideaId: string, updates: Partial<Idea>) => {
    setIdeas(ideas =>
      ideas.map(idea =>
        idea.id === ideaId
          ? { ...idea, ...updates, updatedAt: new Date() }
          : idea
      )
    );
  }, []);

  const updateIdeaFeature = useCallback((ideaId: string, featureId: string, updates: Partial<FeatureRequest>) => {
    setIdeas(ideas =>
      ideas.map(idea =>
        idea.id === ideaId
          ? {
              ...idea,
              features: idea.features.map(featureGroup => ({
                ...featureGroup,
                featureRequests: featureGroup.featureRequests.map(feature =>
                  feature.id === featureId
                    ? { ...feature, ...updates, updatedAt: new Date() }
                    : feature
                )
              })),
              updatedAt: new Date()
            }
          : idea
      )
    );
  }, []);

  const generateComponentsForFeature = useCallback(async (feature: FeatureRequest) => {
    try {
      // Generate component code using AI
      const generatedComponents = await AIApiService.generateComponentCode(feature);
      
      // Save each component to the coderunner file system
      const savedComponents: Component[] = [];
      for (const component of generatedComponents) {
        try {
          // Save component file to coderunner
          const saveResponse = await fetch('/coderunner/api/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: `@breadchris/${component.name}.tsx`,
              content: component.code
            })
          });

          if (saveResponse.ok) {
            // Create component metadata
            const newComponent: Component = {
              id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              name: component.name,
              description: component.description,
              props: component.props || [],
              variants: [{
                id: `variant-${Date.now()}`,
                name: 'Default',
                description: 'Default implementation',
                code: component.code,
                status: 'approved',
                createdAt: new Date(),
                updatedAt: new Date()
              }],
              tags: component.tags || ['ai-generated', feature.name.toLowerCase().replace(/\s+/g, '-')],
              status: 'approved',
              createdAt: new Date(),
              updatedAt: new Date(),
              usageCount: 0,
              reviewComments: [],
              editHistory: []
            };
            savedComponents.push(newComponent);
          }
        } catch (saveError) {
          console.error(`Failed to save component ${component.name}:`, saveError);
        }
      }

      // Update the feature with generated components
      if (selectedIdea && savedComponents.length > 0) {
        updateIdeaFeature(selectedIdea.id, feature.id, {
          associatedComponents: [...feature.associatedComponents, ...savedComponents],
          suggestedComponents: [...feature.suggestedComponents, ...generatedComponents.map(c => c.name)],
          tags: [...feature.tags, 'components-implemented'],
          status: savedComponents.length === generatedComponents.length ? 'completed' : 'in-development'
        });
      }
    } catch (error) {
      console.error('Failed to generate components for feature:', error);
    }
  }, [selectedIdea, updateIdeaFeature]);

  // Input handlers
  const handleIdeaNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewIdea(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleIdeaDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewIdea(prev => ({ ...prev, description: e.target.value }));
  }, []);

  // Handle wizard progression
  const handleBasicInfoNext = useCallback(() => {
    if (newIdea.name.trim() && newIdea.description.trim()) {
      setCurrentIdea({
        name: newIdea.name,
        description: newIdea.description,
        status: 'draft',
        aiEnhanced: true
      });
      setWizardStep('ai-generation');
    }
  }, [newIdea.name, newIdea.description]);

  // Dashboard View
  const DashboardView: React.FC = () => (
    <div className="space-y-6">
      {/* Header with enhanced stats */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-2">AI-Enhanced Component Builder</h1>
        <p className="text-blue-100 mb-4">Transform ideas into features and components with AI assistance</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/10 p-3 rounded-lg">
            <div className="text-2xl font-bold">{ideas.length}</div>
            <div className="text-sm text-blue-100">Ideas</div>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <div className="text-2xl font-bold">
              {ideas.reduce((acc, idea) => acc + idea.totalFeatureRequests, 0)}
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
              {ideas.filter(idea => idea.aiEnhanced).length}
            </div>
            <div className="text-sm text-blue-100">AI Enhanced</div>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <div className="text-2xl font-bold">
              {ideas.reduce((acc, idea) => 
                acc + idea.features.reduce((fAcc, feature) => 
                  fAcc + feature.featureRequests.filter(fr => fr.status === 'completed').length, 0), 0)}
            </div>
            <div className="text-sm text-blue-100">Completed</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setCurrentView('quick-create')}
          className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg shadow hover:shadow-md transition-shadow text-left"
        >
          <div className="text-2xl mb-2">💡</div>
          <h3 className="font-semibold text-lg text-blue-900">Create Idea</h3>
          <p className="text-blue-700 text-sm">Quick setup with manual feature entry and optional AI help</p>
        </button>
        
        <button
          onClick={() => setCurrentView('idea-wizard')}
          className="p-6 bg-white rounded-lg shadow border hover:shadow-md transition-shadow text-left"
        >
          <div className="text-2xl mb-2">🤖</div>
          <h3 className="font-semibold text-lg">AI Wizard</h3>
          <p className="text-gray-600 text-sm">Guided flow with AI-generated feature suggestions</p>
        </button>

        <button
          onClick={() => setCurrentView('library')}
          className="p-6 bg-white rounded-lg shadow border hover:shadow-md transition-shadow text-left"
        >
          <div className="text-2xl mb-2">📚</div>
          <h3 className="font-semibold text-lg">Browse Library</h3>
          <p className="text-gray-600 text-sm">Explore existing components and features</p>
        </button>
      </div>

      {/* Recent Ideas */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Ideas</h2>
        </div>
        <div className="divide-y">
          {ideas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-lg font-medium mb-2">No ideas yet</h3>
              <p>Create your first idea to get started with AI-enhanced feature generation</p>
            </div>
          ) : (
            ideas.slice(0, 5).map((idea) => (
              <div 
                key={idea.id} 
                className="p-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedIdea(idea);
                  setCurrentView('idea-detail');
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-lg">{idea.name}</h3>
                    {idea.aiEnhanced && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                        AI Enhanced
                      </span>
                    )}
                  </div>
                  <StatusBadge status={idea.status} />
                </div>
                <p className="text-gray-600 mb-3">{idea.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{idea.totalFeatureRequests} feature requests</span>
                  <span>•</span>
                  <span>{idea.features.length} features</span>
                  <span>•</span>
                  <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Feature Detail Modal
  const FeatureDetailModal: React.FC = () => {
    if (!selectedFeature) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-xl font-semibold">Feature Details</h3>
            <button 
              onClick={() => setSelectedFeature(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feature Name
                </label>
                <input
                  type="text"
                  value={selectedFeature.name}
                  onChange={(e) => updateFeature(selectedFeature.id, { name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={selectedFeature.description}
                  onChange={(e) => updateFeature(selectedFeature.id, { description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={selectedFeature.priority}
                    onChange={(e) => updateFeature(selectedFeature.id, { priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effort
                  </label>
                  <select
                    value={selectedFeature.effort}
                    onChange={(e) => updateFeature(selectedFeature.id, { effort: e.target.value as 'small' | 'medium' | 'large' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedFeature.status}
                    onChange={(e) => updateFeature(selectedFeature.id, { status: e.target.value as FeatureRequest['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="approved">Approved</option>
                    <option value="in-development">In Development</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <h4 className="font-medium mb-3">Comments ({selectedFeature.comments.length})</h4>
                <div className="space-y-3 mb-4">
                  {selectedFeature.comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-gray-500">
                          {comment.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && addComment(selectedFeature.id)}
                  />
                  <button
                    onClick={() => addComment(selectedFeature.id)}
                    disabled={!newComment.trim()}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300"
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
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
              AI Component Builder
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
        {currentView === 'idea-wizard' && (
          <IdeaWizardView 
            wizardStep={wizardStep}
            setWizardStep={setWizardStep}
            newIdea={newIdea}
            handleIdeaNameChange={handleIdeaNameChange}
            handleIdeaDescriptionChange={handleIdeaDescriptionChange}
            currentIdea={currentIdea}
            isGenerating={isGenerating}
            generateFeaturesWithAI={generateFeaturesWithAI}
            generatedFeatures={generatedFeatures}
            setSelectedFeature={setSelectedFeature}
            completeIdeaCreation={completeIdeaCreation}
            setCurrentView={setCurrentView}
          />
        )}
        {currentView === 'quick-create' && (
          <QuickCreateView 
            quickCreateIdea={quickCreateIdea}
            setQuickCreateIdea={setQuickCreateIdea}
            quickCreateFeatures={quickCreateFeatures}
            newFeatureName={newFeatureName}
            setNewFeatureName={setNewFeatureName}
            addQuickFeature={addQuickFeature}
            updateQuickFeature={updateQuickFeature}
            removeQuickFeature={removeQuickFeature}
            saveQuickIdea={saveQuickIdea}
            generateAISuggestions={generateAISuggestions}
            isGenerating={isGenerating}
            setCurrentView={setCurrentView}
          />
        )}
        {currentView === 'idea-detail' && selectedIdea && (
          <IdeaDetailView 
            idea={selectedIdea}
            setCurrentView={setCurrentView}
            updateIdea={updateIdea}
            updateFeature={updateIdeaFeature}
            generateComponentsForFeature={generateComponentsForFeature}
          />
        )}
      </main>

      {/* Feature Detail Modal */}
      <FeatureDetailModal />
    </div>
  );
};

export default AIEnhancedComponentBuilder;