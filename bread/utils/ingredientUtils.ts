
import { BreadStep } from "../components/bread-recipe";

interface Ingredient {
  name: string;
  amount: string;
  unit?: string;
}

// Map common ingredients to step keywords to determine which ingredients are needed for which steps
const INGREDIENT_STEP_MAPPING: Record<string, string[]> = {
  "flour": ["mix", "autolyse", "dough", "combine"],
  "starter": ["mix", "levain", "dough", "combine", "sourdough"],
  "water": ["mix", "autolyse", "hydration", "dough", "combine"],
  "salt": ["salt", "mix", "dough", "combine"],
  "oil": ["oil", "mix", "dough", "combine"],
  "yeast": ["yeast", "dough", "combine"],
  "butter": ["fat", "mix", "dough", "combine"],
  "sugar": ["sugar", "sweetener", "dough", "combine"],
  "egg": ["egg", "dough", "combine"],
  "milk": ["milk", "dough", "combine"],
  "seeds": ["seed", "mix", "topping", "combine"],
  "herbs": ["herb", "seasoning", "flavor", "combine"],
  "olives": ["olives", "mix", "combine", "fold"],
  "garlic": ["garlic", "flavor", "combine", "mix"]
};

/**
 * Determines if an ingredient is needed for a specific step based on step title and description
 */
function isIngredientForStep(ingredient: Ingredient, step: BreadStep): boolean {
  const stepText = `${step.title.toLowerCase()} ${step.description.toLowerCase()}`;
  const ingredientName = ingredient.name.toLowerCase();
  
  // Check direct mention of the ingredient in the step
  if (stepText.includes(ingredientName)) {
    return true;
  }
  
  // Check if ingredient belongs to a category needed for this step
  for (const [category, keywords] of Object.entries(INGREDIENT_STEP_MAPPING)) {
    if (ingredientName.includes(category)) {
      return keywords.some(keyword => stepText.includes(keyword));
    }
  }
  
  return false;
}

/**
 * Get ingredients needed for a specific step
 */
export function getIngredientsForStep(
  ingredients: Ingredient[],
  step: BreadStep
): Ingredient[] {
  return ingredients.filter(ingredient => isIngredientForStep(ingredient, step));
}

/**
 * Check if a step is a preparation step
 */
export function isPreparationStep(step: BreadStep): boolean {
  const stepTitle = step.title.toLowerCase();
  const stepDesc = step.description.toLowerCase();
  
  const preparationKeywords = [
    "mise en place", "prepare", "gather", "preparation", "measure",
    "setup", "set up", "weigh", "scale", "collect", "starter", "levain"
  ];
  
  return preparationKeywords.some(keyword => 
    stepTitle.includes(keyword) || stepDesc.includes(keyword)
  );
}

/**
 * Check if a step is a mixing or ingredient-heavy step
 */
export function isMixingStep(step: BreadStep): boolean {
  const stepTitle = step.title.toLowerCase();
  const stepDesc = step.description.toLowerCase();
  
  const mixingKeywords = [
    "mix", "combine", "add", "incorporate", "dough", "knead", "autolyse", 
    "hydrate", "stir", "fold in", "blend"
  ];
  
  return mixingKeywords.some(keyword => 
    stepTitle.includes(keyword) || stepDesc.includes(keyword)
  );
}
