import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { getBakingHistory, getCommunityBreadPhotos } from '../../lib/supabase';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { CalendarIcon, Search, Filter, Award, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

interface BakingHistoryProps {
  userId: string;
}

type BreadProgress = {
  id: string;
  user_id: string;
  bread_id: string;
  bread_name: string;
  current_step: number;
  completed_steps: string[];
  start_time: string;
  expected_finish_time: string;
  last_updated: string;
  is_completed: boolean;
};

type BreadPhoto = {
  id: string;
  user_id: string;
  bread_id: string;
  bread_name: string;
  photo_url: string;
  comment?: string;
  created_at: string;
};

export function BakingHistory({ userId }: BakingHistoryProps) {
  const [completedBreads, setCompletedBreads] = useState<BreadProgress[]>([]);
  const [breadPhotos, setBreadPhotos] = useState<BreadPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('completed');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterBread, setFilterBread] = useState<string>('all');

  useEffect(() => {
    const fetchBakingHistory = async () => {
      try {
        setLoading(true);
        
        // Get baking history (completed breads)
        const history = await getBakingHistory(userId);
        
        // Convert history records to BreadProgress format for compatibility
        const completed = history.map(record => ({
          id: record.id,
          user_id: record.user_id,
          bread_id: record.bread_id,
          bread_name: record.bread_name,
          current_step: record.total_steps,
          completed_steps: record.completed_steps,
          start_time: record.start_time,
          expected_finish_time: record.finish_time,
          last_updated: record.created_at,
          is_completed: true
        }));
        setCompletedBreads(completed);
        
        // Get bread photos
        const photos = await getCommunityBreadPhotos(20);
        // Filter to only get photos from this user
        const userPhotos = photos.filter((photo: BreadPhoto) => photo.user_id === userId);
        setBreadPhotos(userPhotos);
      } catch (error) {
        console.error('Error fetching baking history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBakingHistory();
  }, [userId]);

  // Filter and sort completed breads
  const filteredCompletedBreads = completedBreads
    .filter(bread => {
      if (filterBread !== 'all' && bread.bread_id !== filterBread) return false;
      if (searchQuery && !bread.bread_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime();
      } else if (sortBy === 'alphabetical') {
        return a.bread_name.localeCompare(b.bread_name);
      }
      return 0;
    });

  // Filter and sort bread photos
  const filteredBreadPhotos = breadPhotos
    .filter(photo => {
      if (filterBread !== 'all' && photo.bread_id !== filterBread) return false;
      if (searchQuery && !photo.bread_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'alphabetical') {
        return a.bread_name.localeCompare(b.bread_name);
      }
      return 0;
    });

  // Get unique bread types for filter
  const uniqueBreadTypes = Array.from(
    new Set([
      ...completedBreads.map(bread => ({ id: bread.bread_id, name: bread.bread_name })),
      ...breadPhotos.map(photo => ({ id: photo.bread_id, name: photo.bread_name }))
    ].map(bread => JSON.stringify(bread)))
  ).map(bread => JSON.parse(bread));

  const getBreadImage = (breadName: string) => {
    // Map bread names to images - in a real app, these would be stored in the database
    const breadImages = {
      'Classic French Bread': 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Rustic Sourdough': 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Whole Wheat Bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Ciabatta': 'https://images.unsplash.com/photo-1612207569525-7f171d9b614c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Baguette': 'https://images.unsplash.com/photo-1568471173242-461f0a730452?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Classic Sourdough': 'https://images.unsplash.com/photo-1586444248879-bc604563cd04?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    };
    
    return breadImages[breadName] || 'https://images.unsplash.com/photo-1555951015-6da899b5e0b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-amber-200">
        <CardHeader className="bg-gradient-to-r from-amber-100/70 to-amber-50/50 border-b border-amber-100">
          <CardTitle className="font-serif italic">Thy Baking Chronicle</CardTitle>
          <CardDescription>A record of thy breadmaking adventures</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search thy bread history..."
                  className="pl-9 bg-input-background border-amber-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={filterBread} onValueChange={setFilterBread}>
                <SelectTrigger className="w-full sm:w-[200px] border-amber-200 bg-input-background">
                  <Filter className="mr-2 h-4 w-4 text-amber-600" />
                  <SelectValue placeholder="Filter by bread" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bread Types</SelectItem>
                  {uniqueBreadTypes.map((bread: any) => (
                    <SelectItem key={bread.id} value={bread.id}>{bread.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[160px] border-amber-200 bg-input-background">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full mb-6 bg-amber-50">
              <TabsTrigger value="completed" className="flex-1 data-[state=active]:bg-amber-200 data-[state=active]:text-amber-900">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Completed Breads
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex-1 data-[state=active]:bg-amber-200 data-[state=active]:text-amber-900">
                <Award className="mr-2 h-4 w-4" />
                Bread Gallery
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="completed" className="mt-0">
              {loading ? (
                <div className="space-y-4">
                  {Array(3).fill(null).map((_, index) => (
                    <div key={index} className="border border-amber-100 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Skeleton className="h-24 w-24 rounded-md bg-amber-50" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-48 bg-amber-50" />
                          <Skeleton className="h-4 w-32 bg-amber-50" />
                          <Skeleton className="h-4 w-full bg-amber-50" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredCompletedBreads.length === 0 ? (
                <div className="text-center py-12 border border-amber-100 rounded-lg">
                  <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="font-serif italic text-amber-800 mb-2">No Completed Breads Yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    "Haste not in the baking, for time and patience deliver the perfect loaf."
                    When thou completest thy first bread, it shall appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCompletedBreads.map((bread) => (
                    <div key={bread.id} className="border border-amber-100 rounded-lg overflow-hidden">
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-1/4 h-32 sm:h-auto relative">
                          <ImageWithFallback
                            src={getBreadImage(bread.bread_name)}
                            alt={bread.bread_name}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="p-4 sm:p-5 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                            <h3 className="font-serif italic text-amber-800 text-lg">{bread.bread_name}</h3>
                            <Badge variant="outline" className="w-fit mt-1 sm:mt-0 border-amber-200 text-amber-700">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Completed
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm mt-3">
                            <div className="flex items-center text-muted-foreground">
                              <CalendarIcon className="mr-2 h-4 w-4 text-amber-500" />
                              <span>Started: {formatDate(bread.start_time)}</span>
                            </div>
                            
                            <div className="flex items-center text-muted-foreground">
                              <Clock className="mr-2 h-4 w-4 text-amber-500" />
                              <span>Completed: {formatDate(bread.last_updated)}</span>
                            </div>
                          </div>
                          
                          <Separator className="my-3 bg-amber-100" />
                          
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm">
                            <div className="text-muted-foreground">
                              <span>Completed {bread.completed_steps.length} steps</span>
                            </div>
                            
                            <div className="mt-2 sm:mt-0">
                              <Button variant="ghost" size="sm" className="h-8 text-amber-700 hover:text-amber-800 hover:bg-amber-100/50">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="gallery" className="mt-0">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Array(6).fill(null).map((_, index) => (
                    <Skeleton key={index} className="aspect-square rounded-lg bg-amber-50" />
                  ))}
                </div>
              ) : filteredBreadPhotos.length === 0 ? (
                <div className="text-center py-12 border border-amber-100 rounded-lg">
                  <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <Award className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="font-serif italic text-amber-800 mb-2">Thy Gallery Awaits</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    "A picture is but a glimpse into the baker's soul."
                    Share photos of thy baked masterpieces to build thy gallery.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredBreadPhotos.map((photo) => (
                    <div key={photo.id} className="rounded-lg overflow-hidden border border-amber-100 bg-white group">
                      <div className="aspect-square relative">
                        <ImageWithFallback
                          src={photo.photo_url}
                          alt={photo.bread_name}
                          width={400}
                          height={400}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <h4 className="font-serif italic">{photo.bread_name}</h4>
                          <p className="text-xs">{formatDate(photo.created_at)}</p>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-serif italic text-amber-800">{photo.bread_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Shared {formatDistanceToNow(parseISO(photo.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}