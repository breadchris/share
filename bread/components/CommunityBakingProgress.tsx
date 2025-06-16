import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CommunityBakerCard } from "./CommunityBakerCard";
import { getCommunityBakers, CommunityBaker } from "../utils/mockCommunityData";
import { Button } from "./ui/button";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";

export function CommunityBakingProgress() {
  const [bakers, setBakers] = useState<CommunityBaker[]>([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    // Fetch mock community bakers (non-async version)
    const communityBakers = getCommunityBakers();
    setBakers(communityBakers);
    
    // Adjust visible count based on screen size
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const totalPages = Math.ceil(bakers.length / visibleCount);
  
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };
  
  const visibleBakers = bakers.slice(
    currentPage * visibleCount,
    (currentPage + 1) * visibleCount
  );

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-white">
      <CardHeader className="border-b border-amber-100 pb-3">
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2 text-amber-700" />
          <span className="font-serif italic">Community Baking Now</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 pb-4">
        {bakers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No one is currently baking. Be the first!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleBakers.map(baker => (
                <CommunityBakerCard key={baker.id} baker={baker} />
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="border-amber-200 text-amber-800 h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
                </Button>
                
                <div className="flex items-center text-sm text-muted-foreground px-2">
                  <span>{currentPage + 1} of {totalPages}</span>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages - 1}
                  className="border-amber-200 text-amber-800 h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next</span>
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}