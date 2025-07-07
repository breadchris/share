import React, { useState, useEffect, useCallback } from 'react';
import { createConnectTransport } from '@connectrpc/connect-web';
import { createPromiseClient } from '@connectrpc/connect';
import { KanbanService } from '../coderunner/src/gen/proto/kanban/kanban_connect';
import {
  Board,
  Column,
  Card,
  CreateBoardRequest,
  GetBoardRequest,
  ListBoardsRequest,
  CreateColumnRequest,
  CreateCardRequest,
  UpdateCardRequest,
  DeleteCardRequest,
  MoveCardRequest,
  DeleteColumnRequest,
  UpdateBoardRequest,
  DeleteBoardRequest,
} from '../coderunner/src/gen/proto/kanban/kanban_pb';
import { Timestamp } from '@bufbuild/protobuf';

// Create the transport and client
const transport = createConnectTransport({
  baseUrl: '/kanban',
});

const client = createPromiseClient(KanbanService, transport);

interface DragItem {
  id: string;
  type: 'card';
  sourceColumnId: string;
  sourcePosition: number;
}

const KanbanBoard: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

  // Form states
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [boardFormData, setBoardFormData] = useState({ name: '', description: '' });
  const [showColumnForm, setShowColumnForm] = useState(false);
  const [columnFormData, setColumnFormData] = useState({ title: '' });
  const [showCardForm, setShowCardForm] = useState<{ columnId: string } | null>(null);
  const [cardFormData, setCardFormData] = useState({ title: '', description: '' });
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  // Load boards on mount
  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    setLoading(true);
    setError(null);
    try {
      const request = new ListBoardsRequest({ pageSize: 100 });
      const response = await client.listBoards(request);
      setBoards(response.boards);
      
      // If we have boards but none selected, select the first one
      if (response.boards.length > 0 && !selectedBoard) {
        loadBoard(response.boards[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  const loadBoard = async (boardId: string) => {
    setLoading(true);
    setError(null);
    try {
      const request = new GetBoardRequest({ id: boardId });
      const response = await client.getBoard(request);
      setSelectedBoard(response.board);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async () => {
    if (!boardFormData.name.trim()) {
      setError('Board name is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const request = new CreateBoardRequest({
        name: boardFormData.name,
        description: boardFormData.description,
      });
      const response = await client.createBoard(request);
      
      if (response.board) {
        setBoards(prev => [...prev, response.board!]);
        setSelectedBoard(response.board);
        setBoardFormData({ name: '', description: '' });
        setShowBoardForm(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board');
    } finally {
      setLoading(false);
    }
  };

  const updateBoard = async () => {
    if (!selectedBoard || !boardFormData.name.trim()) {
      setError('Board name is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const request = new UpdateBoardRequest({
        id: selectedBoard.id,
        name: boardFormData.name,
        description: boardFormData.description,
      });
      const response = await client.updateBoard(request);
      
      if (response.board) {
        setSelectedBoard(response.board);
        setBoards(prev => prev.map(b => b.id === response.board!.id ? response.board! : b));
        setShowBoardForm(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update board');
    } finally {
      setLoading(false);
    }
  };

  const deleteBoard = async (boardId: string) => {
    if (!confirm('Are you sure you want to delete this board?')) return;

    setLoading(true);
    setError(null);
    try {
      const request = new DeleteBoardRequest({ id: boardId });
      await client.deleteBoard(request);
      
      setBoards(prev => prev.filter(b => b.id !== boardId));
      if (selectedBoard?.id === boardId) {
        setSelectedBoard(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete board');
    } finally {
      setLoading(false);
    }
  };

  const createColumn = async () => {
    if (!selectedBoard || !columnFormData.title.trim()) {
      setError('Column title is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const position = selectedBoard.columns.length;
      const request = new CreateColumnRequest({
        boardId: selectedBoard.id,
        title: columnFormData.title,
        position: position,
      });
      const response = await client.createColumn(request);
      
      if (response.column) {
        // Reload the board to get updated columns
        await loadBoard(selectedBoard.id);
        setColumnFormData({ title: '' });
        setShowColumnForm(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create column');
    } finally {
      setLoading(false);
    }
  };

  const deleteColumn = async (columnId: string) => {
    if (!confirm('Are you sure you want to delete this column and all its cards?')) return;

    setLoading(true);
    setError(null);
    try {
      const request = new DeleteColumnRequest({ id: columnId });
      await client.deleteColumn(request);
      
      // Reload the board to get updated columns
      if (selectedBoard) {
        await loadBoard(selectedBoard.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete column');
    } finally {
      setLoading(false);
    }
  };

  const createCard = async () => {
    if (!showCardForm || !cardFormData.title.trim()) {
      setError('Card title is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const column = selectedBoard?.columns.find(c => c.id === showCardForm.columnId);
      const position = column?.cards.length || 0;
      
      const request = new CreateCardRequest({
        columnId: showCardForm.columnId,
        title: cardFormData.title,
        description: cardFormData.description,
        position: position,
      });
      const response = await client.createCard(request);
      
      if (response.card && selectedBoard) {
        // Reload the board to get updated cards
        await loadBoard(selectedBoard.id);
        setCardFormData({ title: '', description: '' });
        setShowCardForm(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create card');
    } finally {
      setLoading(false);
    }
  };

  const updateCard = async () => {
    if (!editingCard || !cardFormData.title.trim()) {
      setError('Card title is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const request = new UpdateCardRequest({
        id: editingCard.id,
        title: cardFormData.title,
        description: cardFormData.description,
      });
      const response = await client.updateCard(request);
      
      if (response.card && selectedBoard) {
        // Reload the board to get updated cards
        await loadBoard(selectedBoard.id);
        setCardFormData({ title: '', description: '' });
        setEditingCard(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update card');
    } finally {
      setLoading(false);
    }
  };

  const deleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    setLoading(true);
    setError(null);
    try {
      const request = new DeleteCardRequest({ id: cardId });
      await client.deleteCard(request);
      
      // Reload the board to get updated cards
      if (selectedBoard) {
        await loadBoard(selectedBoard.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete card');
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, card: Card, columnId: string) => {
    setDraggedItem({
      id: card.id,
      type: 'card',
      sourceColumnId: columnId,
      sourcePosition: card.position,
    });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string, targetPosition?: number) => {
    e.preventDefault();
    
    if (!draggedItem || !selectedBoard) return;

    // Calculate target position
    const targetColumn = selectedBoard.columns.find(c => c.id === targetColumnId);
    const finalPosition = targetPosition ?? targetColumn?.cards.length ?? 0;

    setLoading(true);
    setError(null);
    try {
      const request = new MoveCardRequest({
        id: draggedItem.id,
        targetColumnId: targetColumnId,
        newPosition: finalPosition,
      });
      await client.moveCard(request);
      
      // Reload the board to get updated cards
      await loadBoard(selectedBoard.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move card');
    } finally {
      setLoading(false);
      setDraggedItem(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
            <button
              onClick={() => {
                setBoardFormData({ name: '', description: '' });
                setShowBoardForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              New Board
            </button>
          </div>

          {/* Board selector */}
          {boards.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => loadBoard(board.id)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selectedBoard?.id === board.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {board.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {loading && !selectedBoard ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : selectedBoard ? (
          <div className="h-full p-6">
            {/* Board header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedBoard.name}</h2>
                {selectedBoard.description && (
                  <p className="text-gray-600 mt-1">{selectedBoard.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setBoardFormData({
                      name: selectedBoard.name,
                      description: selectedBoard.description,
                    });
                    setShowBoardForm(true);
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteBoard(selectedBoard.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Columns */}
            <div className="flex gap-4 h-full overflow-x-auto pb-6">
              {selectedBoard.columns.map((column) => (
                <div
                  key={column.id}
                  className="bg-gray-200 rounded-lg p-4 w-80 flex-shrink-0 flex flex-col"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{column.cards.length}</span>
                      <button
                        onClick={() => deleteColumn(column.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {column.cards.map((card, index) => (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card, column.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => {
                          e.stopPropagation();
                          handleDrop(e, column.id, index);
                        }}
                        className="bg-white rounded p-3 shadow-sm hover:shadow-md transition-shadow cursor-move"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-gray-900">{card.title}</h4>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingCard(card);
                                setCardFormData({
                                  title: card.title,
                                  description: card.description,
                                });
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => deleteCard(card.id)}
                              className="text-red-400 hover:text-red-600"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        {card.description && (
                          <p className="text-sm text-gray-600 mt-2">{card.description}</p>
                        )}
                        {card.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {card.labels.map((label, i) => (
                              <span
                                key={i}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add card button */}
                  <button
                    onClick={() => {
                      setShowCardForm({ columnId: column.id });
                      setCardFormData({ title: '', description: '' });
                    }}
                    className="mt-2 w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-300 rounded transition-colors"
                  >
                    + Add a card
                  </button>
                </div>
              ))}

              {/* Add column button */}
              <div className="bg-gray-200 rounded-lg p-4 w-80 flex-shrink-0">
                <button
                  onClick={() => setShowColumnForm(true)}
                  className="w-full text-left text-gray-600 hover:text-gray-900"
                >
                  + Add a column
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500 mb-4">No boards yet. Create your first board!</p>
            <button
              onClick={() => {
                setBoardFormData({ name: '', description: '' });
                setShowBoardForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create Board
            </button>
          </div>
        )}
      </div>

      {/* Board Form Modal */}
      {showBoardForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              {selectedBoard && boardFormData.name ? 'Edit Board' : 'New Board'}
            </h3>
            <input
              type="text"
              placeholder="Board name"
              value={boardFormData.name}
              onChange={(e) => setBoardFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Description (optional)"
              value={boardFormData.description}
              onChange={(e) => setBoardFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBoardForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={selectedBoard && boardFormData.name ? updateBoard : createBoard}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : selectedBoard && boardFormData.name ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Form Modal */}
      {showColumnForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">New Column</h3>
            <input
              type="text"
              placeholder="Column title"
              value={columnFormData.title}
              onChange={(e) => setColumnFormData({ title: e.target.value })}
              className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowColumnForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={createColumn}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Form Modal */}
      {(showCardForm || editingCard) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              {editingCard ? 'Edit Card' : 'New Card'}
            </h3>
            <input
              type="text"
              placeholder="Card title"
              value={cardFormData.title}
              onChange={(e) => setCardFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Description (optional)"
              value={cardFormData.description}
              onChange={(e) => setCardFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCardForm(null);
                  setEditingCard(null);
                  setCardFormData({ title: '', description: '' });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={editingCard ? updateCard : createCard}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingCard ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;