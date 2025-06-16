
// Conversion rates for common baking ingredients from grams to other units
// These are approximate conversions based on typical densities

interface ConversionRates {
  [ingredient: string]: {
    cup: number;      // grams per cup
    tablespoon: number; // grams per tablespoon
    teaspoon: number;  // grams per teaspoon
  };
}

export const conversionRates: ConversionRates = {
  // Flours
  "bread flour": { cup: 120, tablespoon: 7.5, teaspoon: 2.5 },
  "all-purpose flour": { cup: 120, tablespoon: 7.5, teaspoon: 2.5 },
  "whole wheat flour": { cup: 130, tablespoon: 8.1, teaspoon: 2.7 },
  "rye flour": { cup: 102, tablespoon: 6.4, teaspoon: 2.1 },
  
  // Liquids
  "water": { cup: 237, tablespoon: 14.8, teaspoon: 4.9 },
  "milk": { cup: 240, tablespoon: 15, teaspoon: 5 },
  
  // Fats
  "butter": { cup: 227, tablespoon: 14.2, teaspoon: 4.7 },
  "olive oil": { cup: 216, tablespoon: 13.5, teaspoon: 4.5 },
  
  // Sweeteners
  "sugar": { cup: 200, tablespoon: 12.5, teaspoon: 4.2 },
  "honey": { cup: 340, tablespoon: 21.3, teaspoon: 7.1 },
  "molasses": { cup: 328, tablespoon: 20.5, teaspoon: 6.8 },
  
  // Other
  "salt": { cup: 273, tablespoon: 17.1, teaspoon: 5.7 },
  "sourdough starter": { cup: 240, tablespoon: 15, teaspoon: 5 }, // Assuming 100% hydration
  "yeast": { cup: 150, tablespoon: 9.4, teaspoon: 3.1 },
  "caraway seeds": { cup: 110, tablespoon: 6.9, teaspoon: 2.3 },
};

// Default conversion for ingredients not in the list
const defaultConversion = { cup: 200, tablespoon: 12.5, teaspoon: 4.2 };

/**
 * Converts an amount in grams to the best volumetric unit (cups, tablespoons, or teaspoons)
 * @param amount Amount in grams
 * @param ingredient Ingredient name (for density-specific conversion)
 * @returns Object with converted amount and unit
 */
export function gramToVolume(amount: number, ingredient: string): { amount: string; unit: string } {
  // Find the ingredient in the conversionRates, use default if not found
  const ingredientKey = Object.keys(conversionRates).find(
    key => ingredient.toLowerCase().includes(key.toLowerCase())
  );
  
  const rates = ingredientKey 
    ? conversionRates[ingredientKey] 
    : defaultConversion;
  
  // Convert to the most appropriate unit
  if (amount >= rates.cup * 0.25) {
    // Use cups if 1/4 cup or more
    const cups = amount / rates.cup;
    if (cups === Math.floor(cups)) {
      return { amount: cups.toString(), unit: cups === 1 ? "cup" : "cups" };
    } else if (cups * 4 === Math.floor(cups * 4)) {
      // Handle 1/4, 1/2, 3/4 cup measurements
      const fraction = cups * 4;
      if (fraction === 1) return { amount: "1/4", unit: "cup" };
      if (fraction === 2) return { amount: "1/2", unit: "cup" };
      if (fraction === 3) return { amount: "3/4", unit: "cup" };
      return { amount: `${fraction}/4`, unit: "cups" };
    }
    return { amount: cups.toFixed(1), unit: cups === 1 ? "cup" : "cups" };
  } else if (amount >= rates.tablespoon) {
    // Use tablespoons for smaller amounts
    const tbsp = amount / rates.tablespoon;
    if (tbsp === Math.floor(tbsp)) {
      return { amount: tbsp.toString(), unit: tbsp === 1 ? "tablespoon" : "tablespoons" };
    }
    return { amount: tbsp.toFixed(1), unit: tbsp === 1 ? "tablespoon" : "tablespoons" };
  } else {
    // Use teaspoons for very small amounts
    const tsp = amount / rates.teaspoon;
    if (tsp === Math.floor(tsp)) {
      return { amount: tsp.toString(), unit: tsp === 1 ? "teaspoon" : "teaspoons" };
    }
    return { amount: tsp.toFixed(1), unit: tsp === 1 ? "teaspoon" : "teaspoons" };
  }
}

/**
 * Determines if an ingredient amount can be converted to volume
 * Some ingredients might only make sense in weight measurements
 */
export function canConvertToVolume(ingredient: string): boolean {
  const nonConvertible = [
    "for dusting",
    "to taste",
    "as needed",
    "pinch",
    "dash",
  ];
  
  // Check if the ingredient has a non-convertible description
  return !nonConvertible.some(term => ingredient.toLowerCase().includes(term));
}
