import React, { useState } from 'react';
import { 
  Search, MoreVertical, Filter, Menu, Plus, Grid3X3, 
  Calendar, CheckSquare, LayoutGrid, Database, Layers,
  Zap, Settings, ChevronDown, X, HelpCircle, User,
  Smartphone, Monitor, Info
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  category: string;
  status: 'not-started' | 'in-progress' | 'completed';
}

const GlideAdminDashboard: React.FC = () => {
  const [projects] = useState<Project[]>([
    { id: '1', title: 'Add calendar component', category: 'Engineering', status: 'not-started' },
    { id: '2', title: 'Website redesign', category: 'Design', status: 'not-started' },
    { id: '3', title: 'Finish documentation', category: 'Education', status: 'not-started' },
    { id: '4', title: 'Add help tooltips', category: 'Engineering', status: 'not-started' },
    { id: '5', title: 'Hire SEO agency', category: 'Marketing', status: 'not-started' },
    { id: '6', title: 'Plan Q2 roadmap', category: 'Management', status: 'in-progress' },
    { id: '7', title: 'Improve onboarding', category: 'Engineering', status: 'in-progress' },
    { id: '8', title: 'New landing page', category: 'Design', status: 'in-progress' },
  ]);

  const [activeTab, setActiveTab] = useState('data');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState('card');

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Engineering': 'bg-blue-100 text-blue-600',
      'Design': 'bg-purple-100 text-purple-600',
      'Education': 'bg-green-100 text-green-600',
      'Marketing': 'bg-orange-100 text-orange-600',
      'Management': 'bg-pink-100 text-pink-600',
    };
    return colors[category] || 'bg-gray-100 text-gray-600';
  };

  const columns = [
    { id: 'not-started', title: 'NOT STARTED', projects: projects.filter(p => p.status === 'not-started') },
    { id: 'in-progress', title: 'IN PROGRESS', projects: projects.filter(p => p.status === 'in-progress') },
    { id: 'completed', title: 'COMPLETED', projects: projects.filter(p => p.status === 'completed') },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo and Team */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
              G
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Admin dashboard</h1>
              <p className="text-xs text-gray-500">Jane's team · <span className="text-blue-500">Upgrade</span></p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="mb-2">
              <button className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900">
                <span>NAVIGATION</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <nav className="space-y-1 mt-3">
              <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md">
                <Grid3X3 className="w-4 h-4 mr-3" />
                Board
              </a>
              <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <User className="w-4 h-4 mr-3" />
                Teams
              </a>
            </nav>
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="mb-2">
              <button className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900">
                <span>MENU</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Drag screens here to show them in the side menu.</p>
            <nav className="space-y-1 mt-3">
              <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <User className="w-4 h-4 mr-3" />
                User Profile
              </a>
            </nav>
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">COMPONENTS</span>
              <Plus className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-md">
                <Database className="w-4 h-4 mr-3 text-gray-400" />
                <span>Kanban</span>
                <span className="ml-auto text-xs text-gray-500">Projects (Kanban Board sam...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Popup */}
        {showOnboarding && (
          <div className="m-4 p-4 bg-gray-900 text-white rounded-lg">
            <h3 className="font-semibold mb-2">Get started with Glide</h3>
            <p className="text-sm text-gray-300 mb-3">Would you like a quick tour of the basics of customizing your app?</p>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded">
                Skip tutorial
              </button>
              <button className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 rounded">
                Let's do it!
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center space-x-6">
              <div className="flex space-x-1">
                {['Data', 'Layout', 'Actions', 'Settings'].map((tab) => (
                  <button
                    key={tab.toLowerCase()}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.toLowerCase()
                        ? 'text-gray-900 bg-gray-100'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab === 'Data' && <Database className="w-4 h-4 mr-2" />}
                    {tab === 'Layout' && <Layers className="w-4 h-4 mr-2" />}
                    {tab === 'Actions' && <Zap className="w-4 h-4 mr-2" />}
                    {tab === 'Settings' && <Settings className="w-4 h-4 mr-2" />}
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors">
              Publish
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Mobile Preview */}
          <div className="flex-1 bg-gray-100 p-8 flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <User className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600 flex items-center">
                Viewing as Jane Smith
                <ChevronDown className="w-4 h-4 ml-1" />
              </span>
            </div>
            
            {/* Phone Frame */}
            <div className="relative mx-auto" style={{ width: '375px', height: '812px' }}>
              <div className="absolute inset-0 bg-black rounded-[3rem] shadow-2xl">
                <div className="absolute inset-2 bg-gray-900 rounded-[2.5rem] overflow-hidden">
                  {/* Phone Screen Content */}
                  <div className="h-full flex flex-col">
                    {/* Mobile Header */}
                    <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                      <Menu className="w-6 h-6 text-white" />
                      <h1 className="text-xl font-semibold text-white">Projects</h1>
                      <div className="w-6"></div>
                    </div>

                    {/* Search Bar */}
                    <div className="px-4 py-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Search"
                          className="w-full bg-gray-800 text-white pl-10 pr-10 py-2 rounded-lg focus:outline-none"
                        />
                        <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      </div>
                    </div>

                    {/* Kanban Columns */}
                    <div className="flex-1 px-4 overflow-x-auto">
                      <div className="flex gap-4">
                        {columns.slice(0, 2).map((column) => (
                          <div key={column.id} className="flex-shrink-0 w-[47%]">
                            <div className="flex items-center justify-between mb-3">
                              <h2 className="text-sm font-medium text-gray-400">{column.title}</h2>
                              <Plus className="w-5 h-5 text-gray-400" />
                            </div>
                            
                            {column.projects.map((project) => (
                              <div key={project.id} className="bg-gray-800 rounded-lg p-3 mb-2">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="text-white text-sm font-medium">{project.title}</h3>
                                  <MoreVertical className="w-4 h-4 text-gray-400" />
                                </div>
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(project.category)}`}>
                                  {project.category}
                                </span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Navigation */}
                    <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
                      <div className="flex justify-around">
                        <button className="flex flex-col items-center text-white p-2">
                          <Grid3X3 className="w-5 h-5 mb-1" />
                          <span className="text-xs">Board</span>
                        </button>
                        <button className="flex flex-col items-center text-gray-400 p-2">
                          <User className="w-5 h-5 mb-1" />
                          <span className="text-xs">Teams</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Device Selection */}
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-2">
                <button className="p-2 bg-white rounded-lg shadow-sm">
                  <Smartphone className="w-5 h-5" />
                </button>
                <button className="p-2 bg-gray-100 rounded-lg">
                  <Monitor className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Board</h2>
            </div>
            
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">General</h3>
                  <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 rounded-md hover:bg-gray-100">
                    Options
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">PAGE</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-600">Source</label>
                      <div className="mt-1 flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                        <Database className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Projects (Kanban Board)</span>
                        <ChevronDown className="w-4 h-4 ml-auto text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Label</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md">
                        <span className="text-sm">Board</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">STYLE</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'card', icon: '▭', label: 'Card' },
                      { id: 'grid', icon: '⊞', label: 'Grid' },
                      { id: 'list', icon: '☰', label: 'List' },
                      { id: 'table', icon: '⊟', label: 'Table' }
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                          selectedStyle === style.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl mb-1">{style.icon}</span>
                        <span className="text-xs">{style.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[
                      { id: 'checklist', icon: '☑', label: 'Checklist' },
                      { id: 'calendar', icon: '📅', label: 'Calendar' },
                      { id: 'kanban', icon: '⬚', label: 'Kanban' },
                      { id: 'datagrid', icon: '⊞', label: 'Data Grid' }
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                          selectedStyle === style.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl mb-1">{style.icon}</span>
                        <span className="text-xs">{style.label}</span>
                      </button>
                    ))}
                  </div>

                  <button className="w-full mt-3 p-3 text-blue-600 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all">
                    <span className="text-2xl">⊞</span>
                    <span className="block text-sm mt-1">Custom</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Button */}
      <button className="fixed bottom-4 right-4 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center">
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 flex items-center space-x-4 text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">G</span>
          </div>
          <span className="font-semibold text-black">Glide</span>
        </div>
        <span>curated by</span>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-black rounded-full"></div>
          <span className="font-semibold text-black">Mobbin</span>
        </div>
      </div>
    </div>
  );
};

export default GlideAdminDashboard;