import { useState, useEffect } from "react";
import { BreadRecipe } from "./BreadTypes";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Search, ChevronRight, Bookmark, Info, Plus, Brain, Video } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useUser } from "../contexts/UserContext";
import { getUserRecipes } from "../lib/supabase";
import { toast } from 'sonner';

interface BreadSelectorProps {
  onSelectBread: (recipe: BreadRecipe) => void;
}

export function BreadSelector({ onSelectBread }: BreadSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [userRecipes, setUserRecipes] = useState<BreadRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useUser();
  
  // Load user's recipes
  useEffect(() => {
    const loadUserRecipes = async () => {
      if (!user) {
        setUserRecipes([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const recipes = await getUserRecipes(user.id);
        setUserRecipes(recipes);
        console.log(`✅ Loaded ${recipes.length} user recipes`);
      } catch (error) {
        console.error('❌ Error loading user recipes:', error);
        toast.error('Failed to load your recipes', {
          description: 'Please try refreshing the page'
        });
        setUserRecipes([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserRecipes();
  }, [user]);
  
  // Filter bread recipes based on search query
  const filteredRecipes = userRecipes.filter(recipe => {
    const searchLower = searchQuery.toLowerCase();
    return (
      recipe.name.toLowerCase().includes(searchLower) ||
      recipe.description.toLowerCase().includes(searchLower) ||
      recipe.difficulty.toLowerCase().includes(searchLower) ||
      recipe.ingredients.some(i => i.name.toLowerCase().includes(searchLower))
    );
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-deep-olive border-t-transparent mx-auto mb-4"></div>
          <p className="text-secondary">Loading your recipes...</p>
        </div>
      </div>
    );
  }

  // Show empty state for users with no recipes
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12 border-2 border-dashed border-soft-brown/30 rounded-lg">
          <div className="mx-auto h-12 w-12 text-dusty-rose mb-4">
            <Info className="h-12 w-12" />
          </div>
          <h3 className="mb-2">Sign in to access your recipes</h3>
          <p className="text-secondary">
            Create an account to start building your personal bread recipe collection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Search box */}
      {userRecipes.length > 0 && (
        <div className="relative max-w-xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-soft-brown h-4 w-4" />
            <input
              type="text"
              placeholder="Search your recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-cozy w-full pl-10 pr-4"
            />
          </div>
        </div>
      )}
      
      {/* Bread cards grid */}
      {filteredRecipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {filteredRecipes.map((recipe) => (
            <Card 
              key={recipe.id}
              className={`overflow-hidden border-soft-brown/20 transition-all duration-300 flex flex-col h-full hover-warm ${
                hoveredCardId === recipe.id 
                  ? 'shadow-warm ring-1 ring-soft-brown/30' 
                  : 'shadow-cozy hover:shadow-warm'
              }`}
              onMouseEnter={() => setHoveredCardId(recipe.id)}
              onMouseLeave={() => setHoveredCardId(null)}
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: '3/2' }}>
                <ImageWithFallback
                  src={recipe.imageUrl || "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop"}
                  alt={recipe.name}
                  width={600}
                  height={400}
                  className="object-cover w-full h-full transition-transform duration-700 ease-in-out hover:scale-105"
                />
                <div className="absolute top-0 right-0 p-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded font-medium ${
                    recipe.difficulty === "Beginner" 
                      ? "bg-green-100 text-green-800"
                      : recipe.difficulty === "Intermediate"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {recipe.difficulty}
                  </span>
                </div>
              </div>
              
              <div className="p-3 sm:p-4 flex flex-col h-full">
                <div className="flex justify-between items-start mb-1 sm:mb-2">
                  <h3 className="text-xl">{recipe.name}</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {/* <Button variant="ghost" size="icon" className="h-8 w-8 text-soft-brown/70 -mr-1 -mt-1">
                          <Bookmark className="h-4 w-4" />
                        </Button> */}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Save for later</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <p className="text-secondary text-sm mb-2 sm:mb-3 line-clamp-3">
                  {recipe.description}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div className="flex space-x-2 text-sm text-secondary">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {Math.floor(recipe.totalTime / 60)}h {recipe.totalTime % 60}m
                    </span>
                    <span>•</span>
                    <span>{recipe.ingredients.length} ingredients</span>
                  </div>
                  
                  <Button 
                    onClick={() => onSelectBread(recipe)} 
                    className="flex items-center gap-1 bg-deep-olive text-cloud-white hover:bg-deep-olive/90"
                  >
                    Select
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Empty state for no recipes */}
      {userRecipes.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-soft-brown/30 rounded-lg">
          <div className="mx-auto h-12 w-12 text-dusty-rose mb-4">
            <Info className="h-12 w-12" />
          </div>
          <h3 className="mb-2">No recipes yet</h3>
          <p className="text-secondary mb-6">
            Create your first bread recipe to get started with your baking journey
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Button 
              className="btn-primary bg-deep-olive text-cloud-white hover:bg-deep-olive/90"
              onClick={() => {
                // This will be handled by the parent component's navigation
                window.dispatchEvent(new CustomEvent('navigate-to-create-recipe'));
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Recipe
            </Button>
            
            <Button 
              variant="outline"
              className="border-dusty-rose text-dusty-rose hover:bg-dusty-rose hover:text-cloud-white"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigate-to-ai-recipe'));
              }}
            >
              <Brain className="mr-2 h-4 w-4" />
              AI Generate
            </Button>
          </div>
        </div>
      )}
      
      {/* Empty search results */}
      {userRecipes.length > 0 && filteredRecipes.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-soft-brown/30 rounded-lg">
          <div className="mx-auto h-12 w-12 text-dusty-rose mb-4">
            <Info className="h-12 w-12" />
          </div>
          <h3 className="mb-2">No recipes match your search</h3>
          <p className="text-secondary">
            Try another query or clear your search to see all recipes
          </p>
          <Button 
            variant="outline" 
            onClick={() => setSearchQuery("")}
            className="mt-4 border-deep-olive text-deep-olive hover:bg-deep-olive hover:text-cloud-white"
          >
            Clear Search
          </Button>
        </div>
      )}
      
      {/* Footer quote */}
      {userRecipes.length > 0 && (
        <div className="text-center mt-12 mb-8">
          <p className="italic text-soft-brown/70">
            "Good bread is the most fundamentally satisfying of all foods; and good bread with fresh butter, the greatest of feasts."
          </p>
          <p className="text-sm text-secondary mt-1">— James Beard</p>
        </div>
      )}
    </div>
  );
}

// Simple clock icon for time display
function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}