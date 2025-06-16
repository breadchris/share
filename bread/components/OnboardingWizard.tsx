import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { BreadRecipe } from "./BreadTypes";
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  ChefHat, 
  Heart, 
  Coffee,
  Timer,
  Utensils,
  Scale,
  Cookie,
  Wheat,
  CheckCircle,
  Plus,
  Brain,
  Video,
  BookOpen
} from "lucide-react";

// Types for onboarding data
type SkillLevel = 'novice' | 'occasional' | 'curious' | 'intermediate';
type TimeCommitment = 'minutes' | 'hour' | 'half-day' | 'full-day';
type Equipment = 'measuring-cups' | 'mixing-bowls' | 'loaf-pan' | 'baking-sheet' | 'stand-mixer' | 'dutch-oven' | 'bread-machine' | 'kitchen-scale';
type FlavorPreference = 'classic' | 'sweet' | 'savory' | 'whole-grain' | 'sourdough' | 'international';

interface OnboardingData {
  skillLevel?: SkillLevel;
  timeCommitment?: TimeCommitment;
  equipment: Equipment[];
  flavorPreferences: FlavorPreference[];
}

interface OnboardingWizardProps {
  onComplete: (recommendedRecipe?: BreadRecipe) => void;
  onBack: () => void;
}

export function OnboardingWizard({ onComplete, onBack }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    equipment: [],
    flavorPreferences: []
  });

  const totalSteps = 6; // Welcome, Skill, Time, Equipment, Flavors, Next Steps
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkillSelect = (skill: SkillLevel) => {
    setOnboardingData(prev => ({ ...prev, skillLevel: skill }));
    setTimeout(handleNext, 300);
  };

  const handleTimeSelect = (time: TimeCommitment) => {
    setOnboardingData(prev => ({ ...prev, timeCommitment: time }));
    setTimeout(handleNext, 300);
  };

  const handleEquipmentToggle = (equipment: Equipment) => {
    setOnboardingData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(e => e !== equipment)
        : [...prev.equipment, equipment]
    }));
  };

  const handleFlavorToggle = (flavor: FlavorPreference) => {
    setOnboardingData(prev => ({
      ...prev,
      flavorPreferences: prev.flavorPreferences.includes(flavor)
        ? prev.flavorPreferences.filter(f => f !== flavor)
        : [...prev.flavorPreferences, flavor]
    }));
  };

  const handleCreateFirstRecipe = () => {
    // Trigger navigation to create recipe page
    window.dispatchEvent(new CustomEvent('navigate-to-create-recipe'));
    onComplete();
  };

  const handleUseAI = () => {
    // Trigger navigation to AI recipe creation
    window.dispatchEvent(new CustomEvent('navigate-to-ai-recipe'));
    onComplete();
  };

  const handleCompleteWithoutRecipe = () => {
    onComplete();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="text-center max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="w-20 h-20 bg-dusty-rose/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-dusty-rose" />
              </div>
              <h1 className="text-dusty-rose mb-4">Welcome to Your Bread Journey!</h1>
              <p className="text-secondary text-lg leading-relaxed">
                We're excited to help you start creating your own bread recipes. This quick guide takes just 2 minutes 
                and will help us understand your preferences so we can guide you to the best recipe creation approach.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-cloud-white/50 rounded-lg p-4 border border-dusty-rose/20">
                <ChefHat className="h-6 w-6 text-dusty-rose mx-auto mb-2" />
                <h6 className="text-dusty-rose mb-1">Skill Assessment</h6>
                <p className="text-xs text-secondary">Find the right starting point</p>
              </div>
              
              <div className="bg-cloud-white/50 rounded-lg p-4 border border-dusty-rose/20">
                <Clock className="h-6 w-6 text-dusty-rose mx-auto mb-2" />
                <h6 className="text-dusty-rose mb-1">Time Planning</h6>
                <p className="text-xs text-secondary">Match recipes to your schedule</p>
              </div>
              
              <div className="bg-cloud-white/50 rounded-lg p-4 border border-dusty-rose/20">
                <Heart className="h-6 w-6 text-dusty-rose mx-auto mb-2" />
                <h6 className="text-dusty-rose mb-1">Personal Touch</h6>
                <p className="text-xs text-secondary">Customize based on your tastes</p>
              </div>
            </div>
            
            <Button 
              onClick={handleNext}
              size="lg"
              className="bg-dusty-rose hover:bg-dusty-rose/90 text-cloud-white px-8"
            >
              Let's Get Started!
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        );

      case 1: // Skill Level
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <ChefHat className="h-12 w-12 text-deep-olive mx-auto mb-4" />
              <h2>What's your baking experience?</h2>
              <p className="text-secondary mt-2">
                This helps us recommend the best recipe creation approach for you.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card 
                className="p-6 cursor-pointer hover-warm border-2 hover:border-deep-olive transition-all"
                onClick={() => handleSkillSelect('novice')}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-warm-beige rounded-full flex items-center justify-center mx-auto mb-3">
                    <Coffee className="h-6 w-6 text-deep-olive" />
                  </div>
                  <h4 className="mb-2">Complete Novice</h4>
                  <p className="text-secondary text-sm">
                    "I've never baked anything before"
                  </p>
                  <Badge variant="outline" className="mt-3 border-deep-olive text-deep-olive">
                    Start Simple
                  </Badge>
                </div>
              </Card>
              
              <Card 
                className="p-6 cursor-pointer hover-warm border-2 hover:border-deep-olive transition-all"
                onClick={() => handleSkillSelect('occasional')}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-warm-beige rounded-full flex items-center justify-center mx-auto mb-3">
                    <Cookie className="h-6 w-6 text-deep-olive" />
                  </div>
                  <h4 className="mb-2">Occasional Baker</h4>
                  <p className="text-secondary text-sm">
                    "I've baked a few things but nothing bread-specific"
                  </p>
                  <Badge variant="outline" className="mt-3 border-deep-olive text-deep-olive">
                    Building Skills
                  </Badge>
                </div>
              </Card>
              
              <Card 
                className="p-6 cursor-pointer hover-warm border-2 hover:border-deep-olive transition-all"
                onClick={() => handleSkillSelect('curious')}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-warm-beige rounded-full flex items-center justify-center mx-auto mb-3">
                    <Wheat className="h-6 w-6 text-deep-olive" />
                  </div>
                  <h4 className="mb-2">Bread Curious</h4>
                  <p className="text-secondary text-sm">
                    "I've made simple breads like banana bread or pizza dough"
                  </p>
                  <Badge variant="outline" className="mt-3 border-deep-olive text-deep-olive">
                    Ready to Explore
                  </Badge>
                </div>
              </Card>
              
              <Card 
                className="p-6 cursor-pointer hover-warm border-2 hover:border-deep-olive transition-all"
                onClick={() => handleSkillSelect('intermediate')}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-warm-beige rounded-full flex items-center justify-center mx-auto mb-3">
                    <ChefHat className="h-6 w-6 text-deep-olive" />
                  </div>
                  <h4 className="mb-2">Intermediate</h4>
                  <p className="text-secondary text-sm">
                    "I've made yeasted breads before but want to improve"
                  </p>
                  <Badge variant="outline" className="mt-3 border-deep-olive text-deep-olive">
                    Skill Building
                  </Badge>
                </div>
              </Card>
            </div>
          </div>
        );

      case 2: // Time Availability
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Timer className="h-12 w-12 text-deep-olive mx-auto mb-4" />
              <h2>How much time can you typically dedicate?</h2>
              <p className="text-secondary mt-2">
                This helps us suggest recipes that fit your lifestyle.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card 
                className="p-6 cursor-pointer hover-warm border-2 hover:border-deep-olive transition-all"
                onClick={() => handleTimeSelect('minutes')}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-warm-beige rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-6 w-6 text-deep-olive" />
                  </div>
                  <h4 className="mb-2">Just Minutes</h4>
                  <p className="text-secondary text-sm mb-2">
                    15-30 minutes of active time
                  </p>
                  <p className="text-xs text-deep-olive">
                    Perfect for: Drop biscuits, quick muffins, pancakes
                  </p>
                </div>
              </Card>
              
              <Card 
                className="p-6 cursor-pointer hover-warm border-2 hover:border-deep-olive transition-all"
                onClick={() => handleTimeSelect('hour')}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-warm-beige rounded-full flex items-center justify-center mx-auto mb-3">
                    <Timer className="h-6 w-6 text-deep-olive" />
                  </div>
                  <h4 className="mb-2">Quick Session</h4>
                  <p className="text-secondary text-sm mb-2">
                    About an hour total
                  </p>
                  <p className="text-xs text-deep-olive">
                    Perfect for: Banana bread, soda bread, flatbreads
                  </p>
                </div>
              </Card>
              
              <Card 
                className="p-6 cursor-pointer hover-warm border-2 hover:border-deep-olive transition-all"
                onClick={() => handleTimeSelect('half-day')}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-warm-beige rounded-full flex items-center justify-center mx-auto mb-3">
                    <Coffee className="h-6 w-6 text-deep-olive" />
                  </div>
                  <h4 className="mb-2">Half Day</h4>
                  <p className="text-secondary text-sm mb-2">
                    A few hours, including waiting time
                  </p>
                  <p className="text-xs text-deep-olive">
                    Perfect for: No-knead bread, focaccia, enriched doughs
                  </p>
                </div>
              </Card>
              
              <Card 
                className="p-6 cursor-pointer hover-warm border-2 hover:border-deep-olive transition-all"
                onClick={() => handleTimeSelect('full-day')}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-warm-beige rounded-full flex items-center justify-center mx-auto mb-3">
                    <ChefHat className="h-6 w-6 text-deep-olive" />
                  </div>
                  <h4 className="mb-2">Bread Day</h4>
                  <p className="text-secondary text-sm mb-2">
                    I can dedicate most of a day to the process
                  </p>
                  <p className="text-xs text-deep-olive">
                    Perfect for: Sourdough, artisan loaves, complex breads
                  </p>
                </div>
              </Card>
            </div>
          </div>
        );

      case 3: // Equipment Check
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Utensils className="h-12 w-12 text-deep-olive mx-auto mb-4" />
              <h2>What equipment do you have?</h2>
              <p className="text-secondary mt-2">
                Select all that apply. This helps us suggest recipes that work with your current setup.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {[
                { id: 'measuring-cups', name: 'Measuring Cups', icon: <Coffee className="h-5 w-5" /> },
                { id: 'mixing-bowls', name: 'Mixing Bowls', icon: <Coffee className="h-5 w-5" /> },
                { id: 'loaf-pan', name: 'Loaf Pan', icon: <Coffee className="h-5 w-5" /> },
                { id: 'baking-sheet', name: 'Baking Sheet', icon: <Cookie className="h-5 w-5" /> },
                { id: 'stand-mixer', name: 'Stand Mixer', icon: <Utensils className="h-5 w-5" /> },
                { id: 'dutch-oven', name: 'Dutch Oven', icon: <Coffee className="h-5 w-5" /> },
                { id: 'bread-machine', name: 'Bread Machine', icon: <Utensils className="h-5 w-5" /> },
                { id: 'kitchen-scale', name: 'Kitchen Scale', icon: <Scale className="h-5 w-5" /> }
              ].map((equipment) => (
                <Card 
                  key={equipment.id}
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    onboardingData.equipment.includes(equipment.id as Equipment)
                      ? 'border-deep-olive bg-deep-olive/10' 
                      : 'border-border hover:border-deep-olive'
                  }`}
                  onClick={() => handleEquipmentToggle(equipment.id as Equipment)}
                >
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      onboardingData.equipment.includes(equipment.id as Equipment)
                        ? 'bg-deep-olive text-cloud-white'
                        : 'bg-warm-beige text-deep-olive'
                    }`}>
                      {equipment.icon}
                    </div>
                    <p className="text-sm">{equipment.name}</p>
                    {onboardingData.equipment.includes(equipment.id as Equipment) && (
                      <CheckCircle className="h-4 w-4 text-deep-olive mx-auto mt-1" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={handleNext}
                className="bg-deep-olive hover:bg-deep-olive/90 text-cloud-white"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 4: // Flavor Preferences
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Heart className="h-12 w-12 text-deep-olive mx-auto mb-4" />
              <h2>What flavors interest you most?</h2>
              <p className="text-secondary mt-2">
                Select up to 3 flavor profiles that sound delicious to you.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { 
                  id: 'classic', 
                  name: 'Classic/Traditional', 
                  description: 'Simple, timeless bread recipes',
                  icon: <Wheat className="h-6 w-6" />
                },
                { 
                  id: 'sweet', 
                  name: 'Sweet', 
                  description: 'Banana bread, cinnamon rolls, sweet treats',
                  icon: <Cookie className="h-6 w-6" />
                },
                { 
                  id: 'savory', 
                  name: 'Savory/Herbed', 
                  description: 'Focaccia, herb breads, cheese breads',
                  icon: <ChefHat className="h-6 w-6" />
                },
                { 
                  id: 'whole-grain', 
                  name: 'Whole Grain/Nutty', 
                  description: 'Hearty, healthy, full of texture',
                  icon: <Wheat className="h-6 w-6" />
                },
                { 
                  id: 'sourdough', 
                  name: 'Sourdough Tang', 
                  description: 'Fermented flavors, complex tastes',
                  icon: <Coffee className="h-6 w-6" />
                },
                { 
                  id: 'international', 
                  name: 'International', 
                  description: 'Naan, brioche, pretzels, exotic flavors',
                  icon: <Heart className="h-6 w-6" />
                }
              ].map((flavor) => (
                <Card 
                  key={flavor.id}
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    onboardingData.flavorPreferences.includes(flavor.id as FlavorPreference)
                      ? 'border-deep-olive bg-deep-olive/10' 
                      : 'border-border hover:border-deep-olive'
                  }`}
                  onClick={() => handleFlavorToggle(flavor.id as FlavorPreference)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      onboardingData.flavorPreferences.includes(flavor.id as FlavorPreference)
                        ? 'bg-deep-olive text-cloud-white'
                        : 'bg-warm-beige text-deep-olive'
                    }`}>
                      {flavor.icon}
                    </div>
                    <div className="flex-1">
                      <h5 className="mb-1">{flavor.name}</h5>
                      <p className="text-secondary text-sm">{flavor.description}</p>
                      {onboardingData.flavorPreferences.includes(flavor.id as FlavorPreference) && (
                        <CheckCircle className="h-4 w-4 text-deep-olive mt-2" />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={handleNext}
                className="bg-deep-olive hover:bg-deep-olive/90 text-cloud-white"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 5: // Next Steps - Recipe Creation Guidance
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-dusty-rose/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-dusty-rose" />
              </div>
              <h2>Perfect! Now let's create your first recipe</h2>
              <p className="text-secondary mt-2">
                Based on your preferences, here are the best ways to get started with recipe creation.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mb-8">
              {/* Primary recommendation based on skill level */}
              <Card className="p-6 border-2 border-dusty-rose bg-dusty-rose/5">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-dusty-rose rounded-full flex items-center justify-center flex-shrink-0">
                    {onboardingData.skillLevel === 'novice' ? (
                      <BookOpen className="h-6 w-6 text-cloud-white" />
                    ) : (
                      <Plus className="h-6 w-6 text-cloud-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-dusty-rose mb-2">
                      {onboardingData.skillLevel === 'novice' 
                        ? 'Start with Manual Recipe Creation' 
                        : 'Create Your Own Recipe'}
                    </h4>
                    <p className="text-secondary text-sm mb-4">
                      {onboardingData.skillLevel === 'novice'
                        ? 'Begin with our guided recipe builder. We\'ll walk you through each step and provide helpful tips for beginners.'
                        : 'Use our comprehensive recipe editor to document your favorite bread recipes with ingredients, steps, and timing.'}
                    </p>
                    <Button 
                      onClick={handleCreateFirstRecipe}
                      className="bg-dusty-rose hover:bg-dusty-rose/90 text-cloud-white"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Recipe
                    </Button>
                  </div>
                </div>
              </Card>

              {/* AI Generation */}
              <Card className="p-6 border-2 border-deep-olive/30 hover:border-deep-olive transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-deep-olive rounded-full flex items-center justify-center flex-shrink-0">
                    <Brain className="h-6 w-6 text-cloud-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-deep-olive mb-2">Try AI Recipe Generation</h4>
                    <p className="text-secondary text-sm mb-4">
                      Describe your ideal bread or upload a photo, and our AI will create a detailed recipe for you. 
                      Perfect for recreating breads you've loved or exploring new ideas.
                    </p>
                    <Button 
                      onClick={handleUseAI}
                      variant="outline"
                      className="border-deep-olive text-deep-olive hover:bg-deep-olive hover:text-cloud-white"
                    >
                      <Brain className="mr-2 h-4 w-4" />
                      Generate with AI
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Video Import */}
              <Card className="p-6 border-2 border-soft-brown/30 hover:border-soft-brown transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-soft-brown rounded-full flex items-center justify-center flex-shrink-0">
                    <Video className="h-6 w-6 text-cloud-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-soft-brown mb-2">Import from YouTube</h4>
                    <p className="text-secondary text-sm mb-4">
                      Found a great bread recipe video? Import it and annotate the steps to create your own 
                      personalized version with precise timing and notes.
                    </p>
                    <Button 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('navigate-to-youtube-recipe'));
                        onComplete();
                      }}
                      variant="outline"
                      className="border-soft-brown text-soft-brown hover:bg-soft-brown hover:text-cloud-white"
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Import Video
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="text-center">
              <Button 
                onClick={handleCompleteWithoutRecipe}
                variant="ghost"
                className="text-deep-olive hover:text-deep-olive/80"
              >
                I'll explore later
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container-cozy section-cozy">
      {/* Header with progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={currentStep === 0 ? onBack : handlePrevious}
            className="text-soft-brown hover:text-deep-olive hover:bg-dusty-rose/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentStep === 0 ? 'Back' : 'Previous'}
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-secondary">
              Step {currentStep + 1} of {totalSteps}
            </p>
          </div>
          
          <div className="w-20"> {/* Spacer for layout balance */}</div>
        </div>
        
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step content */}
      <div className="min-h-[500px] flex items-center justify-center">
        {renderStepContent()}
      </div>
    </div>
  );
}