
import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { SquareScaleIcon, Weight, Droplet } from "lucide-react";
import { gramToVolume, canConvertToVolume } from "../utils/unitConverter";

interface Ingredient {
  name: string;
  amount: string;
  unit?: string;
}

interface IngredientCardProps {
  ingredients: Ingredient[];
  activeStepIndex?: number;
  title?: string;
}

export function IngredientCard({ 
  ingredients, 
  activeStepIndex, 
  title = "Ingredients" 
}: IngredientCardProps) {
  const [useMetric, setUseMetric] = useState(true);
  
  // Check if we have ingredients with actual numerical amounts
  const hasConvertibleIngredients = ingredients.some(ing => {
    return !isNaN(Number(ing.amount)) && canConvertToVolume(ing.amount);
  });
  
  return (
    <Card className="p-4 mb-4 border-amber-200 bg-amber-50/60">
      <div className="mb-3 flex justify-between items-center">
        <h3 className="font-serif italic text-amber-900">
          {title}
        </h3>
        
        {hasConvertibleIngredients && (
          <div className="flex items-center gap-2">
            <Weight size={16} className="text-amber-700" />
            <Switch 
              id="unit-toggle" 
              checked={!useMetric}
              onCheckedChange={() => setUseMetric(!useMetric)}
              className="data-[state=checked]:bg-amber-600"
            />
            <Droplet size={16} className="text-amber-700" />
            <span className="text-xs text-amber-800 ml-1">
              {useMetric ? "Metric" : "Volume"}
            </span>
          </div>
        )}
      </div>
      
      <ul className="space-y-2 text-sm">
        {ingredients.map((ingredient, index) => {
          // Skip ingredients with "for dusting" or similar descriptions
          if (ingredient.amount === "for dusting" || 
              ingredient.amount === "to taste" || 
              ingredient.amount === "") {
            return (
              <li key={index} className="flex justify-between items-baseline">
                <span className="font-medium">{ingredient.name}</span>
                <span className="text-amber-700">{ingredient.amount}</span>
              </li>
            );
          }
          
          // For numeric amounts, handle unit conversion
          const amount = Number(ingredient.amount);
          if (!isNaN(amount) && useMetric === false && canConvertToVolume(ingredient.name)) {
            // Convert to volume units
            const volumeConverted = gramToVolume(amount, ingredient.name);
            
            return (
              <li key={index} className="flex justify-between items-baseline">
                <span className="font-medium">{ingredient.name}</span>
                <span className="text-amber-700">{volumeConverted.amount} {volumeConverted.unit}</span>
              </li>
            );
          } else {
            // Show original weight units
            return (
              <li key={index} className="flex justify-between items-baseline">
                <span className="font-medium">{ingredient.name}</span>
                <span className="text-amber-700">
                  {ingredient.amount} {ingredient.unit || ""}
                </span>
              </li>
            );
          }
        })}
      </ul>
    </Card>
  );
}
