import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { CommunityBaker, getRelativeTimeString } from "../utils/mockCommunityData";
import { Clock, MapPin } from "lucide-react";

interface CommunityBakerCardProps {
  baker: CommunityBaker;
}

export function CommunityBakerCard({ baker }: CommunityBakerCardProps) {
  const progressPercentage = Math.round((baker.completedSteps.length / baker.totalSteps) * 100);
  
  // Calculate remaining time
  const remainingTimeString = getRelativeTimeString(baker.expectedFinishTime);
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md border-amber-100">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border border-amber-200">
            <AvatarImage src={baker.avatar} alt={baker.username} />
            <AvatarFallback className="bg-amber-100 text-amber-800">
              {baker.username.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-serif font-medium truncate">{baker.username}</h4>
            <p className="text-sm text-muted-foreground truncate flex items-center">
              {baker.location && (
                <>
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{baker.location}</span>
                </>
              )}
            </p>
          </div>
        </div>
        
        <div className="mb-3">
          <h5 className="font-serif italic text-amber-800 mb-1">{baker.breadName}</h5>
          <div className="flex justify-between text-sm text-muted-foreground mb-1.5">
            <span>Step {baker.currentStep} of {baker.totalSteps}</span>
            <span>{progressPercentage}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-1.5 bg-amber-100" />
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>Finishing {remainingTimeString}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}