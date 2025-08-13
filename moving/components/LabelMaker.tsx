import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Trash2, Download, Plus, QrCode, Package, Eye, Edit, Hash } from 'lucide-react';
import { Box } from '../App';
import { LabelPreview } from './LabelPreview';

interface LabelMakerProps {
  boxes: Box[];
  onAddBox: (box: Omit<Box, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateBox: (boxId: string, updates: Partial<Box>) => Promise<void>;
  onDeleteBox: (boxId: string) => Promise<void>;
}

const COLORS = [
  { name: 'Red', value: '#ef4444', bg: 'bg-red-500' },
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Green', value: '#10b981', bg: 'bg-green-500' },
  { name: 'Yellow', value: '#f59e0b', bg: 'bg-yellow-500' },
  { name: 'Purple', value: '#8b5cf6', bg: 'bg-purple-500' },
  { name: 'Pink', value: '#ec4899', bg: 'bg-pink-500' },
  { name: 'Orange', value: '#f97316', bg: 'bg-orange-500' },
  { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500' },
];

const ROOMS = [
  'Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Office', 'Garage', 'Basement', 'Attic', 'Other'
];

export function LabelMaker({ boxes, onAddBox, onUpdateBox, onDeleteBox }: LabelMakerProps) {
  const [newBox, setNewBox] = useState({
    name: '',
    color: COLORS[0].value,
    room: '',
    boxNumber: '',
    qrCode: '',
  });
  const [previewBox, setPreviewBox] = useState<Box | null>(null);
  const [editingBox, setEditingBox] = useState<Box | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    color: '',
    room: '',
    boxNumber: '',
    qrCode: '',
  });

  const generateQRCode = (boxId: string) => {
    // Create a URL that could be used to add items to this box
    const baseUrl = window.location.origin;
    return `${baseUrl}?box=${boxId}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBox.name.trim() || !newBox.room) return;

    const tempId = Date.now().toString();
    const qrCode = generateQRCode(tempId);
    
    try {
      await onAddBox({
        name: newBox.name.trim(),
        color: newBox.color,
        room: newBox.room,
        boxNumber: newBox.boxNumber.trim() || undefined,
        items: [],
        qrCode: newBox.qrCode.trim() || qrCode
      });

      setNewBox({ name: '', color: COLORS[0].value, room: '', boxNumber: '', qrCode: '' });
    } catch (error) {
      console.error('Failed to add box:', error);
    }
  };

  const printBatchLabels = (boxes: Box[]) => {
    if (boxes.length === 0) return;
    
    const printWindow = window.open('', '', 'width=1000,height=800,scrollbars=yes');
    if (!printWindow) return;

    // Generate QR Code using an online API service
    const generateQRCodeURL = (text: string) => {
      return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(text)}`;
    };

    // Group boxes into sets of 4 for each page
    const pages = [];
    for (let i = 0; i < boxes.length; i += 4) {
      pages.push(boxes.slice(i, i + 4));
    }

    const generateLabelHTML = (box: Box) => {
      return `
        <div class="label-container">
          <!-- Top half -->
          <div class="label-half-top" style="background: ${box.color}; border: 3px solid ${box.color}; border-bottom: 1.5px solid ${box.color};">
            <div class="top-content">
              <div class="room-text">${box.room}</div>
            </div>
            <div class="qr-code-container">
              <img src="${generateQRCodeURL(box.qrCode)}" alt="QR Code" onerror="this.parentElement.innerHTML='<div class=\\"qr-placeholder\\">QR<br/>CODE</div>'" />
            </div>
            <div class="box-id-text">ID: ${box.id.slice(-6)}</div>
          </div>
          
          <!-- Fold line -->
          <div class="fold-line"></div>
          
          <!-- Bottom half -->
          <div class="label-half-bottom" style="background: ${box.color}; border: 3px solid ${box.color}; border-top: 1.5px solid ${box.color};">
            <div class="bottom-room-section">
              <div class="room-text">${box.room}</div>
            </div>
            <div class="hand-number-section">
              <div class="hand-number-label">Box #</div>
              <div class="hand-number-line"></div>
            </div>
            <div class="box-id-text">ID: ${box.id.slice(-6)}</div>
          </div>
        </div>
      `;
    };

    const pagesHTML = pages.map((pageBoxes, pageIndex) => {
      // Create a 2x2 table for more reliable layout
      const row1 = [pageBoxes[0], pageBoxes[1]];
      const row2 = [pageBoxes[2], pageBoxes[3]];
      
      const generateRow = (boxes: (Box | undefined)[]) => {
        return `
          <tr>
            <td class="label-cell">${boxes[0] ? generateLabelHTML(boxes[0]) : '<div class="empty-label">Cut along this line</div>'}</td>
            <td class="label-cell">${boxes[1] ? generateLabelHTML(boxes[1]) : '<div class="empty-label">Cut along this line</div>'}</td>
          </tr>
        `;
      };

      return `
        <div class="page" ${pageIndex < pages.length - 1 ? 'style="page-break-after: always;"' : ''}>
          <table class="labels-table">
            ${generateRow(row1)}
            ${generateRow(row2)}
          </table>
        </div>
      `;
    }).join('');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Batch Print Labels - ${boxes.length} Labels</title>
          <style>
            * {
              box-sizing: border-box;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              background: white;
              font-size: 12pt;
            }
            .page {
              width: 8.5in;
              height: 11in;
              margin: 0 auto;
              padding: 0.25in;
              box-sizing: border-box;
            }
            .labels-table {
              width: 100%;
              height: 100%;
              border-collapse: separate;
              border-spacing: 0.125in;
              table-layout: fixed;
            }
            .label-cell {
              width: 4in;
              height: 5.25in;
              padding: 0;
              margin: 0;
              vertical-align: top;
            }
            .label-container { 
              width: 100%; 
              height: 100%; 
              background: white;
              border: 2px solid #666;
              display: flex;
              flex-direction: column;
              position: relative;
              box-sizing: border-box;
            }
            .empty-label {
              color: #999;
              font-size: 14px;
              text-align: center;
              border: 2px dashed #ccc;
              background: #f9f9f9;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
            }
            .label-half-top { 
              width: 100%; 
              height: 50%; 
              padding: 20px; 
              text-align: center;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-sizing: border-box;
              position: relative;
            }
            .label-half-bottom {
              width: 100%; 
              height: 50%; 
              padding: 20px; 
              text-align: left;
              display: flex;
              flex-direction: column;
              justify-content: center;
              box-sizing: border-box;
              position: relative;
              transform: rotate(180deg);
            }
            .fold-line {
              position: absolute;
              top: 50%;
              left: 0;
              right: 0;
              height: 3px;
              background: repeating-linear-gradient(
                90deg,
                #4b5563 0px,
                #4b5563 8px,
                transparent 8px,
                transparent 16px
              );
              z-index: 10;
              transform: translateY(-50%);
            }
            .room-text { 
              font-size: 28px; 
              font-weight: bold; 
              margin-bottom: 8px;
              color: white;
              line-height: 1.1;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .qr-code-container {
              width: 80px;
              height: 80px;
              margin: 10px auto;
              background: white;
              padding: 6px;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-code-container img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .qr-placeholder {
              width: 100%;
              height: 100%;
              border: 2px dashed rgba(255, 255, 255, 0.7);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              color: rgba(255, 255, 255, 0.9);
              line-height: 1.1;
              font-weight: 600;
              background: rgba(255, 255, 255, 0.1);
            }
            .bottom-room-section {
              margin-bottom: 16px;
            }
            .hand-number-section {
              background: rgba(255, 255, 255, 0.2);
              border: 3px dashed rgba(255, 255, 255, 0.5);
              border-radius: 6px;
              padding: 16px 20px;
              margin-right: 40px;
            }
            .hand-number-label {
              font-size: 14px;
              color: rgba(255, 255, 255, 0.8);
              margin-bottom: 8px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .hand-number-line {
              height: 28px;
              border-bottom: 3px solid rgba(255, 255, 255, 0.5);
            }
            .box-id-text {
              font-size: 12px;
              color: rgba(255, 255, 255, 0.7);
              font-family: 'Courier New', monospace;
              font-weight: 600;
            }
            .label-half-bottom .box-id-text {
              margin-top: 16px;
            }
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page {
                size: 8.5in 11in;
                margin: 0;
              }
              body { 
                padding: 0 !important; 
                margin: 0 !important;
                background: white !important;
                font-size: 12pt !important;
                width: 8.5in !important;
                height: 11in !important;
              }
              .page {
                margin: 0 !important;
                page-break-after: always !important;
                width: 8.5in !important;
                height: 11in !important;
                padding: 0.25in !important;
              }
              .page:last-child {
                page-break-after: auto !important;
              }
              .labels-table {
                width: 100% !important;
                height: 100% !important;
                border-spacing: 0.1in !important;
              }
              .label-cell {
                width: 4in !important;
                height: 5.25in !important;
              }
              .label-container { 
                border: 2px solid #000 !important;
                width: 100% !important;
                height: 100% !important;
              }
              .fold-line {
                background: repeating-linear-gradient(
                  90deg,
                  #000 0px,
                  #000 6px,
                  transparent 6px,
                  transparent 12px
                ) !important;
                height: 3px !important;
              }
            }
          </style>
        </head>
        <body>
          ${pagesHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for the page to fully render and images to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
    };
  };

  const printLabel = (box: Box) => {
    // For single label printing, we'll print 4 copies on one page for efficiency
    printBatchLabels([box, box, box, box]);
  };

  const handleEdit = (box: Box) => {
    setEditingBox(box);
    setEditForm({
      name: box.name,
      color: box.color,
      room: box.room,
      boxNumber: box.boxNumber || '',
      qrCode: box.qrCode,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBox || !editForm.name.trim() || !editForm.room) return;

    try {
      await onUpdateBox(editingBox.id, {
        name: editForm.name.trim(),
        color: editForm.color,
        room: editForm.room,
        boxNumber: editForm.boxNumber.trim() || undefined,
        qrCode: editForm.qrCode.trim() || editingBox.qrCode,
      });

      setEditingBox(null);
    } catch (error) {
      console.error('Failed to update box:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create New Label Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Create New Box Label</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Labels print 4 per page (4" × 5.25" each) and fold over box edges to be readable from both sides. 
            Use the preview feature to see exactly how your labels will look when printed.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="box-name">Box Name</Label>
                <Input
                  id="box-name"
                  value={newBox.name}
                  onChange={(e) => setNewBox(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Kitchen Essentials"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room">Room</Label>
                <Select value={newBox.room} onValueChange={(value) => setNewBox(prev => ({ ...prev, room: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOMS.map(room => (
                      <SelectItem key={room} value={room}>{room}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="box-number">Box Number (Optional)</Label>
                <Input
                  id="box-number"
                  value={newBox.boxNumber}
                  onChange={(e) => setNewBox(prev => ({ ...prev, boxNumber: e.target.value }))}
                  placeholder="e.g., 001, B12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr-code">QR Code Link (Optional)</Label>
                <Input
                  id="qr-code"
                  value={newBox.qrCode}
                  onChange={(e) => setNewBox(prev => ({ ...prev, qrCode: e.target.value }))}
                  placeholder="Custom URL or leave blank for auto-generated"
                />
              </div>

              <div className="space-y-2">
                <Label>Label Color</Label>
                <div className="grid grid-cols-4 gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewBox(prev => ({ ...prev, color: color.value }))}
                      className={`w-8 h-8 rounded-full ${color.bg} border-2 ${
                        newBox.color === color.value ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={!newBox.name.trim() || !newBox.room}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Label
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Label Preview - {newBox.name || 'New Label'}</DialogTitle>
                    <DialogDescription>
                      Preview how your double-sided edge label will look when folded over your box edge.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <LabelPreview 
                      box={{
                        id: 'preview',
                        name: newBox.name || 'Sample Box',
                        color: newBox.color,
                        room: newBox.room || 'Sample Room',
                        boxNumber: newBox.boxNumber || undefined,
                        items: [],
                        qrCode: '',
                        createdAt: new Date()
                      }} 
                      colors={COLORS} 
                    />
                  </div>
                </DialogContent>
              </Dialog>

              <Button type="submit">
                <Plus className="h-4 w-4 mr-2" />
                Create Label
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing Labels */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Box Labels ({boxes.length})</h2>
          {boxes.length > 0 && (
            <Button 
              onClick={() => printBatchLabels(boxes)}
              className="flex items-center space-x-2"
              title="Print all labels at once"
            >
              <Download className="h-4 w-4" />
              <span>Print All ({boxes.length})</span>
            </Button>
          )}
        </div>
        
        {boxes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No labels created yet. Create your first box label above!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boxes.map(box => {
              const colorInfo = COLORS.find(c => c.value === box.color);
              return (
                <Card key={box.id} className="border-2" style={{ borderColor: box.color }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg" style={{ color: box.color }}>
                        {box.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ background: box.color }}
                          title={colorInfo?.name}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              await onDeleteBox(box.id);
                            } catch (error) {
                              console.error('Failed to delete box:', error);
                            }
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Room:</span>
                      <Badge variant="secondary">{box.room}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Box Number:</span>
                      <span className="text-sm font-mono flex items-center">
                        <Hash className="h-3 w-3 mr-1 text-gray-400" />
                        {box.boxNumber || 'None'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Items:</span>
                      <span>{box.items.length}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">QR Code:</span>
                      <QrCode className="h-4 w-4 text-gray-400" />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(box)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Edit Box - {box.name}</DialogTitle>
                            <DialogDescription>
                              Update the box information including name, room, color, and box number.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Box Name</Label>
                              <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-room">Room</Label>
                              <Select value={editForm.room} onValueChange={(value) => setEditForm(prev => ({ ...prev, room: value }))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROOMS.map(room => (
                                    <SelectItem key={room} value={room}>{room}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-box-number">Box Number</Label>
                              <Input
                                id="edit-box-number"
                                value={editForm.boxNumber}
                                onChange={(e) => setEditForm(prev => ({ ...prev, boxNumber: e.target.value }))}
                                placeholder="e.g., 001, B12"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-qr">QR Code Link</Label>
                              <Input
                                id="edit-qr"
                                value={editForm.qrCode}
                                onChange={(e) => setEditForm(prev => ({ ...prev, qrCode: e.target.value }))}
                                placeholder="Custom URL"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Label Color</Label>
                              <div className="grid grid-cols-4 gap-2">
                                {COLORS.map(color => (
                                  <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setEditForm(prev => ({ ...prev, color: color.value }))}
                                    className={`w-8 h-8 rounded-full ${color.bg} border-2 ${
                                      editForm.color === color.value ? 'border-gray-800' : 'border-gray-300'
                                    }`}
                                    title={color.name}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                              <Button type="button" variant="outline" onClick={() => setEditingBox(null)}>
                                Cancel
                              </Button>
                              <Button type="submit">
                                Save Changes
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewBox(box)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Label Preview - {box.name}</DialogTitle>
                            <DialogDescription>
                              Preview and print your double-sided edge label that folds over the box edge.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <LabelPreview box={box} colors={COLORS} />
                          </div>
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button 
                              onClick={() => printLabel(box)}
                              className="flex items-center"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Print Label
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        onClick={() => printLabel(box)}
                        size="sm"
                        title="Print double-sided edge label that folds over box edge"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}