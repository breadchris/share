import React, { useState, useEffect } from 'react';
import { createConnectTransport } from '@connectrpc/connect-web';
import { createPromiseClient } from '@connectrpc/connect';
import { ExampleService } from '../gen/proto/example/example_connect';
import { 
  CreateItemRequest, 
  GetItemRequest, 
  UpdateItemRequest, 
  DeleteItemRequest, 
  ListItemsRequest,
  Item 
} from '../coderunner/src/gen/proto/example/example_pb';

// Create the transport and client
const transport = createConnectTransport({
  baseUrl: '/example',
});

const client = createPromiseClient(ExampleService, transport);

interface ItemFormData {
  name: string;
  description: string;
  metadata: Record<string, string>;
}

const ExampleClient: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    description: '',
    metadata: {}
  });
  const [metadataKey, setMetadataKey] = useState('');
  const [metadataValue, setMetadataValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Load items on component mount
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const request = new ListItemsRequest({
        pageSize: 50,
        filter: ''
      });
      
      const response = await client.listItems(request);
      setItems(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const createItem = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const request = new CreateItemRequest({
        name: formData.name,
        description: formData.description,
        metadata: formData.metadata
      });

      const response = await client.createItem(request);
      if (response.item) {
        setItems(prev => [...prev, response.item!]);
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async () => {
    if (!selectedItem || !formData.name.trim()) {
      setError('Item and name are required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const request = new UpdateItemRequest({
        id: selectedItem.id,
        name: formData.name,
        description: formData.description,
        metadata: formData.metadata
      });

      const response = await client.updateItem(request);
      if (response.item) {
        setItems(prev => prev.map(item => 
          item.id === response.item!.id ? response.item! : item
        ));
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const request = new DeleteItemRequest({ id });
      await client.deleteItem(request);
      setItems(prev => prev.filter(item => item.id !== id));
      if (selectedItem?.id === id) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const editItem = (item: Item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      metadata: { ...item.metadata }
    });
    setIsEditing(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', metadata: {} });
    setMetadataKey('');
    setMetadataValue('');
    setSelectedItem(null);
    setIsEditing(false);
  };

  const addMetadata = () => {
    if (metadataKey.trim() && metadataValue.trim()) {
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataKey.trim()]: metadataValue.trim()
        }
      }));
      setMetadataKey('');
      setMetadataValue('');
    }
  };

  const removeMetadata = (key: string) => {
    setFormData(prev => {
      const newMetadata = { ...prev.metadata };
      delete newMetadata[key];
      return { ...prev, metadata: newMetadata };
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Example Service Client</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h2 className="text-xl font-bold mb-4">
          {isEditing ? 'Edit Item' : 'Create New Item'}
        </h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Name *
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter item name"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Description
          </label>
          <textarea
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter item description"
            rows={3}
          />
        </div>

        {/* Metadata */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Metadata
          </label>
          
          {/* Add metadata */}
          <div className="flex gap-2 mb-2">
            <input
              className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              value={metadataKey}
              onChange={(e) => setMetadataKey(e.target.value)}
              placeholder="Key"
            />
            <input
              className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              value={metadataValue}
              onChange={(e) => setMetadataValue(e.target.value)}
              placeholder="Value"
            />
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              onClick={addMetadata}
              type="button"
            >
              Add
            </button>
          </div>

          {/* Display metadata */}
          {Object.entries(formData.metadata).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 mb-1">
              <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                <strong>{key}:</strong> {value}
              </span>
              <button
                className="text-red-500 hover:text-red-700 text-sm"
                onClick={() => removeMetadata(key)}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={isEditing ? updateItem : createItem}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isEditing ? 'Update Item' : 'Create Item')}
          </button>
          
          {isEditing && (
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={resetForm}
              type="button"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Items</h2>
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            onClick={loadItems}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading && items.length === 0 ? (
          <div className="text-center py-4">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No items found</div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border rounded p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    {item.description && (
                      <p className="text-gray-600 mt-1">{item.description}</p>
                    )}
                    
                    {/* Metadata */}
                    {Object.keys(item.metadata).length > 0 && (
                      <div className="mt-2">
                        <strong className="text-sm">Metadata:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(item.metadata).map(([key, value]) => (
                            <span key={key} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              <strong>{key}:</strong> {value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Timestamps */}
                    <div className="text-xs text-gray-500 mt-2">
                      Created: {item.createdAt?.toDate().toLocaleString()}
                      {item.updatedAt && (
                        <span className="ml-4">
                          Updated: {item.updatedAt.toDate().toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm"
                      onClick={() => editItem(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                      onClick={() => deleteItem(item.id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExampleClient;