import { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { getUserProfile, updateUserProfile } from '../../lib/supabase';
import { Loader2, Save, Edit, MapPin, Bookmark, Award, Cake } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

interface UserProfileProps {
  userId: string;
}

export function UserProfile({ userId }: UserProfileProps) {
  const { user } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    location: '',
    bio: '',
    avatar_url: '',
    favorite_bread: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await getUserProfile(userId);
        setProfile(profileData);
        
        // Initialize form data
        if (profileData) {
          setFormData({
            username: profileData.username || '',
            location: profileData.location || '',
            bio: profileData.bio || '',
            avatar_url: profileData.avatar_url || '',
            favorite_bread: profileData.favorite_bread || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Could not fetch thy profile. Pray, try again anon.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const success = await updateUserProfile(userId, formData);
      
      if (success) {
        // Update the local profile state
        setProfile({
          ...profile,
          ...formData
        });
        setEditing(false);
        toast.success('Thy profile hath been updated!');
      } else {
        toast.error('Failed to update thy profile.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred whilst updating thy profile.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      ? name
          .split(' ')
          .map(part => part[0])
          .join('')
          .toUpperCase()
      : 'SB'; // Default: Shakespearean Baker
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  // Mock data for profile statistics
  const stats = {
    breadsCompleted: 8,
    activeBakes: 2,
    favoriteBread: formData.favorite_bread || 'Rustic Sourdough',
    memberSince: 'May 1, 2025'
  };

  // Mock data for badges
  const badges = [
    { name: 'Sourdough Master', description: 'Completed 5 sourdough recipes' },
    { name: 'Early Riser', description: 'Started baking before 6am' },
    { name: 'Community Star', description: 'Shared 3 bread photos' }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-amber-200">
        <CardHeader className="bg-gradient-to-r from-amber-100/70 to-amber-50/50 border-b border-amber-100">
          <CardTitle className="font-serif italic">Thy Baker's Profile</CardTitle>
          <CardDescription>Manage thy personal information and preferences</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-4 border-2 border-amber-200">
                <AvatarImage src={formData.avatar_url} alt={formData.username} />
                <AvatarFallback className="bg-amber-200 text-amber-800 text-2xl">
                  {getInitials(formData.username)}
                </AvatarFallback>
              </Avatar>
              
              {editing ? (
                <div className="w-full">
                  <Label htmlFor="avatar_url" className="text-sm font-serif italic">Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    name="avatar_url"
                    value={formData.avatar_url}
                    onChange={handleInputChange}
                    placeholder="Enter image URL for thy avatar"
                    className="bg-input-background border-amber-200"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Provide a link to an image that represents thee
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="font-serif italic text-amber-800 text-xl">{formData.username || 'Shakespearean Baker'}</h3>
                  {formData.location && (
                    <div className="flex items-center justify-center mt-1 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      <span className="text-sm">{formData.location}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-6 w-full bg-amber-50 rounded-lg p-4 border border-amber-100">
                <h4 className="font-serif italic text-amber-800 mb-2 text-center">Baking Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Cake className="h-3.5 w-3.5 mr-1.5" /> Breads Completed
                    </span>
                    <span className="font-medium text-amber-900">{stats.breadsCompleted}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Bookmark className="h-3.5 w-3.5 mr-1.5" /> Favorite Bread
                    </span>
                    <span className="font-medium text-amber-900">{stats.favoriteBread}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Award className="h-3.5 w-3.5 mr-1.5" /> Member Since
                    </span>
                    <span className="font-medium text-amber-900">{stats.memberSince}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:w-2/3">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username" className="font-serif italic">Thy Name</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="How art thou known?"
                      className="bg-input-background border-amber-200"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location" className="font-serif italic">Thy Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="From which realm dost thou hail?"
                      className="bg-input-background border-amber-200"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="favorite_bread" className="font-serif italic">Favorite Bread</Label>
                    <Input
                      id="favorite_bread"
                      name="favorite_bread"
                      value={formData.favorite_bread}
                      onChange={handleInputChange}
                      placeholder="Which bread dost thou favor most?"
                      className="bg-input-background border-amber-200"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bio" className="font-serif italic">About Thee</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Share thy baking journey with fellow bakers..."
                      rows={4}
                      className="bg-input-background border-amber-200"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-serif italic text-amber-800 mb-2">About</h3>
                  <p className="text-muted-foreground mb-6">
                    {formData.bio || "This baker hath not yet penned their tale. Their bread, however, speaks volumes."}
                  </p>
                  
                  <Separator className="my-6 bg-amber-100" />
                  
                  <h3 className="font-serif italic text-amber-800 mb-3">Baker's Achievements</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {badges.map((badge, index) => (
                      <Badge key={index} variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                        {badge.name}
                      </Badge>
                    ))}
                  </div>
                  
                  <Separator className="my-6 bg-amber-100" />
                  
                  <h3 className="font-serif italic text-amber-800 mb-3">Baking Philosophy</h3>
                  <blockquote className="border-l-2 border-amber-300 pl-4 italic text-muted-foreground">
                    "There are more things in heaven and earth, Horatio, than are dreamt of in your philosophy - and many of them involve flour and water."
                  </blockquote>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="border-t border-amber-100 pt-4 flex justify-end">
          {editing ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setEditing(false)} 
                className="mr-2 border-amber-200 text-amber-800"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setEditing(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}