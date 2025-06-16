import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { 
  ChefHat, 
  Scale, 
  Search, 
  ShoppingBasket, 
  X, 
  CheckCircle, 
  FolderOpen 
} from 'lucide-react';
import { BreadStep } from './bread-recipe';

interface Ingredient {
  name: string;
  amount: string;
  unit?: string;
  stepId: string;
}

interface IngredientsOverviewProps {
  ingredients: Ingredient[];
  steps: BreadStep[];
  breadName: string;
}

export function IngredientsOverview({ ingredients, steps, breadName }: IngredientsOverviewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<'by-step' | 'all'>('by-step');

  // Map of step IDs to names for easy reference
  const stepNameMap = steps.reduce((acc, step) => {
    acc[step.id] = step.title;
    return acc;
  }, {} as Record<string, string>);

  // Filter ingredients by search term
  const filteredIngredients = ingredients.filter(ing => 
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle an ingredient's checked status
  const toggleIngredient = (ingredient: Ingredient) => {
    const key = `${ingredient.name}-${ingredient.stepId}`;
    const newChecked = new Set(checkedIngredients);
    
    if (newChecked.has(key)) {
      newChecked.delete(key);
    } else {
      newChecked.add(key);
    }
    
    setCheckedIngredients(newChecked);
  };

  // Clear all checked ingredients
  const clearChecked = () => {
    setCheckedIngredients(new Set());
  };

  // Group ingredients by step
  const ingredientsByStep = steps.map(step => {
    const stepIngredients = ingredients.filter(
      ing => ing.stepId === step.id && 
      (searchTerm === '' || ing.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return {
      step,
      ingredients: stepIngredients
    };
  }).filter(group => group.ingredients.length > 0);

  // Render an ingredient item
  const renderIngredient = (ingredient: Ingredient) => {
    const key = `${ingredient.name}-${ingredient.stepId}`;
    const isChecked = checkedIngredients.has(key);
    
    return (
      <div 
        key={key}
        className={`
          flex items-center justify-between p-3 border rounded-lg cursor-pointer
          ${isChecked ? 'bg-green-50 border-green-200' : 'bg-white border-amber-100 hover:bg-amber-50'}
        `}
        onClick={() => toggleIngredient(ingredient)}
      >
        <div className="flex items-center">
          <div className={`
            w-5 h-5 rounded-full border flex items-center justify-center mr-2
            ${isChecked ? 'border-green-500 bg-green-100' : 'border-amber-300'}
          `}>
            {isChecked && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
          <span className={isChecked ? 'line-through text-muted-foreground' : ''}>
            {ingredient.name}
          </span>
        </div>
        
        <Badge 
          variant="outline" 
          className={`
            flex items-center
            ${isChecked 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-amber-50 border-amber-200 text-amber-800'
            }
          `}
        >
          <Scale className="h-3 w-3 mr-1" />
          <span>{ingredient.amount}</span>
          {ingredient.unit && <span className="ml-1">{ingredient.unit}</span>}
        </Badge>
      </div>
    );
  };

  return (
    <Card className="border-amber-200">
      <CardHeader className="bg-gradient-to-r from-amber-100/70 to-amber-50/50 border-b border-amber-100">
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif italic flex items-center">
            <ChefHat className="h-5 w-5 mr-2 text-amber-700" />
            Ingredients for {breadName}
          </CardTitle>
          {checkedIngredients.size > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearChecked}
              className="text-amber-700 hover:text-amber-900 hover:bg-amber-100/50"
            >
              <X className="h-4 w-4 mr-1" />
              Clear ({checkedIngredients.size})
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 border-amber-200 bg-input-background"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="by-step" className="mt-2">
          <TabsList className="w-full mb-4 bg-amber-50">
            <TabsTrigger 
              value="by-step" 
              className="flex-1 data-[state=active]:bg-amber-200 data-[state=active]:text-amber-900"
              onClick={() => setActiveView('by-step')}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              By Step
            </TabsTrigger>
            <TabsTrigger 
              value="all" 
              className="flex-1 data-[state=active]:bg-amber-200 data-[state=active]:text-amber-900"
              onClick={() => setActiveView('all')}
            >
              <ShoppingBasket className="mr-2 h-4 w-4" />
              Shopping List
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="by-step" className="mt-0 space-y-6">
            {ingredientsByStep.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm 
                  ? `No ingredients matching "${searchTerm}"`
                  : 'No ingredients found for this recipe'}
              </div>
            ) : (
              ingredientsByStep.map(group => (
                <div key={group.step.id} className="space-y-3">
                  <h3 className="font-medium text-amber-900 mb-2">
                    {group.step.title}
                  </h3>
                  <div className="space-y-2">
                    {group.ingredients.map(ingredient => renderIngredient(ingredient))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="all" className="mt-0">
            <div className="space-y-3">
              {filteredIngredients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm 
                    ? `No ingredients matching "${searchTerm}"`
                    : 'No ingredients found for this recipe'}
                </div>
              ) : (
                filteredIngredients.map(ingredient => renderIngredient(ingredient))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}