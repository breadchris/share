import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Search, Filter, AlertTriangle, Package, Image as ImageIcon } from 'lucide-react';
import { Box, BoxItem } from '../App';

interface SpreadsheetViewProps {
  boxes: Box[];
}

interface FlattenedItem extends BoxItem {
  boxName: string;
  boxColor: string;
  room: string;
  boxId: string;
  boxNumber?: string;
}

export function SpreadsheetView({ boxes }: SpreadsheetViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [fragileFilter, setFragileFilter] = useState('all');
  const [boxNumberFilter, setBoxNumberFilter] = useState('all');

  // Flatten all items from all boxes
  const allItems: FlattenedItem[] = useMemo(() => {
    return boxes.flatMap(box => 
      box.items.map(item => ({
        ...item,
        boxName: box.name,
        boxColor: box.color,
        room: box.room,
        boxId: box.id,
        boxNumber: box.boxNumber
      }))
    );
  }, [boxes]);

  // Filter items based on search and filters
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.boxName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.boxNumber && item.boxNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRoom = roomFilter === 'all' || item.room === roomFilter;
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesFragile = fragileFilter === 'all' || 
        (fragileFilter === 'fragile' && item.fragile) ||
        (fragileFilter === 'non-fragile' && !item.fragile);
      
      const matchesBoxNumber = boxNumberFilter === 'all' ||
        (boxNumberFilter === 'with-number' && item.boxNumber && item.boxNumber.trim()) ||
        (boxNumberFilter === 'without-number' && (!item.boxNumber || !item.boxNumber.trim()));

      return matchesSearch && matchesRoom && matchesCategory && matchesFragile && matchesBoxNumber;
    });
  }, [allItems, searchTerm, roomFilter, categoryFilter, fragileFilter, boxNumberFilter]);

  // Get unique values for filters
  const rooms = [...new Set(boxes.map(box => box.room))].sort();
  const categories = [...new Set(allItems.map(item => item.category).filter(Boolean))].sort();


  const clearFilters = () => {
    setSearchTerm('');
    setRoomFilter('all');
    setCategoryFilter('all');
    setFragileFilter('all');
    setBoxNumberFilter('all');
  };

  if (boxes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No boxes or items to display. Create some boxes and add items first!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{boxes.length}</div>
            <div className="text-sm text-gray-600">Total Boxes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{allItems.length}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {allItems.filter(item => item.fragile).length}
            </div>
            <div className="text-sm text-gray-600">Fragile Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-indigo-600">
              {allItems.filter(item => item.image).length}
            </div>
            <div className="text-sm text-gray-600">Items with Images</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{rooms.length}</div>
            <div className="text-sm text-gray-600">Rooms</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search items, boxes, or box numbers..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Room</label>
              <Select value={roomFilter} onValueChange={setRoomFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All rooms</SelectItem>
                  {rooms.map(room => (
                    <SelectItem key={room} value={room}>{room}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fragile</label>
              <Select value={fragileFilter} onValueChange={setFragileFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All items</SelectItem>
                  <SelectItem value="fragile">Fragile only</SelectItem>
                  <SelectItem value="non-fragile">Non-fragile only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Box Number</label>
              <Select value={boxNumberFilter} onValueChange={setBoxNumberFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All boxes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All boxes</SelectItem>
                  <SelectItem value="with-number">With box number</SelectItem>
                  <SelectItem value="without-number">Without box number</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Items ({filteredItems.length} of {allItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No items match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Box</TableHead>
                    <TableHead>Box #</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Image</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, index) => (
                    <TableRow key={`${item.boxId}-${item.id}-${index}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {item.fragile && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" title="Fragile" />
                          )}
                          <span>{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {item.description || '-'}
                      </TableCell>
                      <TableCell>
                        {item.category ? (
                          <Badge variant="outline">{item.category}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ background: item.boxColor }}
                          />
                          <span>{item.boxName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {item.boxNumber || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.room}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.fragile ? (
                          <Badge variant="destructive" className="bg-orange-100 text-orange-800">
                            Fragile
                          </Badge>
                        ) : (
                          <Badge variant="outline">Regular</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-8 h-8 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded border flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}