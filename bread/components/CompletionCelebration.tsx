import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Sparkles, Clock, Calendar, ArrowRight } from 'lucide-react';
import { BreadStep } from './bread-recipe';

interface CompletionCelebrationProps {
  breadName: string;
  totalSteps: number;
  totalTime: number; // in minutes
  onContinue: () => void;
}

export function CompletionCelebration({ 
  breadName, 
  totalSteps, 
  totalTime,
  onContinue
}: CompletionCelebrationProps) {
  // Format total time into hours and minutes
  const formatTotalTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes 
      ? `${hours} hour${hours > 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}` 
      : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  // Generate a shakespearean congratulatory message
  const getShakespeareanMessage = () => {
    const messages = [
      "O wondrous baker! Thy loaf is complete, a masterpiece fit for the finest feast!",
      "Hark! The bread is done, and verily 'tis a triumph of thy culinary prowess!",
      "What light from yonder oven breaks? It is thy bread, and it is divine!",
      "Rejoice, noble baker! Thy bread journey hath reached its glorious conclusion!",
      "By the pricking of my thumbs, something delicious this way comes!"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <Card className="border-amber-200 overflow-hidden bg-gradient-to-b from-amber-50/80 to-white">
      <CardHeader className="bg-gradient-to-r from-amber-100 to-amber-50 border-b border-amber-200">
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif italic text-xl">Baking Complete!</CardTitle>
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-amber-600 animate-pulse" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 pb-4">
        <div className="text-center mb-6">
          <div className="inline-flex mx-auto rounded-full bg-amber-100 p-3 mb-4">
            <div className="rounded-full bg-amber-200 p-3">
              <Sparkles className="h-6 w-6 text-amber-700" />
            </div>
          </div>
          
          <h3 className="font-serif italic text-xl text-amber-900 mb-2">
            {breadName}
          </h3>
          
          <p className="text-muted-foreground">
            {getShakespeareanMessage()}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 bg-amber-50 rounded-lg p-3 border border-amber-100 flex items-center gap-3">
            <div className="bg-amber-100 rounded-full p-2">
              <Calendar className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-amber-900">Steps Completed</h4>
              <p className="text-amber-700">{totalSteps} steps</p>
            </div>
          </div>
          
          <div className="flex-1 bg-amber-50 rounded-lg p-3 border border-amber-100 flex items-center gap-3">
            <div className="bg-amber-100 rounded-full p-2">
              <Clock className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-amber-900">Total Baking Time</h4>
              <p className="text-amber-700">{formatTotalTime(totalTime)}</p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Your bread is ready to be enjoyed! Don't forget to share a photo of your creation with the community.
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-amber-100 pt-4 flex justify-center">
        <Button
          className="bg-amber-600 hover:bg-amber-700 text-white"
          onClick={onContinue}
        >
          Share Your Creation
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}