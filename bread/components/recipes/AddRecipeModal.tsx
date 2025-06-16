import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { RecipeForm } from "./RecipeForm";
import { Plus } from "lucide-react";
import { toast } from "sonner";

// Import the BreadRecipe type to convert our form data to the application's format
import { BreadRecipe } from "../BreadTypes";

export function AddRecipeModal() {
  const [isOpen, setIsOpen] = useState(false);

  // This function would be called when a new recipe is saved
  const handleSaveRecipe = (recipeData: any) => {
    console.log("Saving recipe:", recipeData);
    
    // Here you would normally save the recipe to your database
    // For now, we'll just show a success message and close the modal
    
    toast.success(`Recipe "${recipeData.name}" created successfully!`, {
      description: "Your recipe has been added to your collection.",
      duration: 4000
    });
    
    setIsOpen(false);
  };

  // Convert the form data to the BreadRecipe format used by the application
  const convertToBreadRecipe = (formData: any): BreadRecipe => {
    // Generate a URL-friendly ID from the recipe name
    const id = formData.name.toLowerCase().replace(/\s+/g, '-');
    
    // Convert ingredients to the format expected by the application
    const ingredients = formData.ingredients.map((ing: any) => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit
    }));
    
    // Convert steps to the format expected by the application
    const steps = formData.steps.map((step: any, index: number) => ({
      id: `${id}-step-${index + 1}`,
      title: `Step ${index + 1}`,
      description: step.instruction,
      duration: step.duration,
      isActiveTime: step.isActiveTime
    }));
    
    // Calculate total time
    const prepTime = parseInt(formData.activeTime) || 0;
    const totalTime = prepTime + (parseInt(formData.passiveTime) || 0);
    
    // Create the BreadRecipe object
    return {
      id,
      name: formData.name,
      description: `A delicious homemade bread recipe with ${formData.ingredients.length} ingredients.`,
      difficulty: "Intermediate",
      prepTime,
      totalTime,
      ingredients,
      imageUrl: formData.imageUrl || "/path/to/default/bread.jpg",
      steps
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-800 hover:bg-amber-900 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add New Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Add New Recipe</DialogTitle>
        </DialogHeader>
        <RecipeForm 
          onSave={handleSaveRecipe} 
          onCancel={() => setIsOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}