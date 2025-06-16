
export interface BreadStep {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  isActiveTime: boolean; // whether this step requires active attention
  tips?: string[];
}

export const breadRecipe: BreadStep[] = [
  {
    id: "starter-preparation",
    title: "Starter/Levain Preparation",
    description: "Feed your sourdough starter and let it reach peak activity (doubled in size with a domed top).",
    duration: 480, // 8 hours average
    isActiveTime: false,
    tips: [
      "Use a 1:1:1 ratio (starter:water:flour) for a predictable rise time",
      "Your starter is ready when it doubles in size and has a pleasant, slightly tangy aroma",
      "Warmer environments speed up fermentation, cooler ones slow it down"
    ]
  },
  {
    id: "autolyse",
    title: "Autolyse",
    description: "Mix flour and water together, then let rest to develop gluten structure.",
    duration: 60, // 1 hour average
    isActiveTime: true,
    tips: [
      "Mix until no dry flour remains, but don't over-mix",
      "Cover the dough to prevent drying out",
      "The longer the autolyse, the more developed the gluten becomes"
    ]
  },
  {
    id: "mix-incorporation",
    title: "Mix/Incorporation",
    description: "Add the levain and salt to the autolysed dough and mix thoroughly.",
    duration: 20, // 20 minutes average
    isActiveTime: true,
    tips: [
      "Dimple the dough and add levain first, then salt",
      "Pinch and fold the dough to fully incorporate ingredients",
      "The dough will initially feel wet but will come together with mixing"
    ]
  },
  {
    id: "bulk-fermentation",
    title: "Bulk Fermentation",
    description: "Allow the dough to rise while performing stretch and folds to develop strength.",
    duration: 240, // 4 hours average
    isActiveTime: false,
    tips: [
      "Perform 4-6 sets of stretch and folds during the first 2 hours",
      "The dough is ready when it's increased in volume by 30-50% and feels light and airy",
      "Look for bubbles on the surface and a domed appearance"
    ]
  },
  {
    id: "pre-shape",
    title: "Pre-shape",
    description: "Gently shape the dough into a round and let it rest.",
    duration: 25, // 25 minutes average
    isActiveTime: true,
    tips: [
      "Use a bench scraper to help gather the dough",
      "Work gently to preserve the fermentation gases",
      "A short rest helps the gluten relax for final shaping"
    ]
  },
  {
    id: "final-shape",
    title: "Final Shape",
    description: "Shape the dough into its final form for proofing.",
    duration: 15, // 15 minutes average
    isActiveTime: true,
    tips: [
      "Create good tension without tearing the dough",
      "Seal the seams well to prevent splitting during baking",
      "Different shapes (batard, boule, etc.) require different techniques"
    ]
  },
  {
    id: "proof",
    title: "Proof",
    description: "Allow the shaped dough to rise until ready to bake.",
    duration: 180, // 3 hours at room temp average
    isActiveTime: false,
    tips: [
      "Can be done at room temperature (2-4 hours) or in the refrigerator (8-14 hours)",
      "The poke test: dough should spring back slowly when poked",
      "Cold proofing develops more flavor and makes scoring easier"
    ]
  },
  {
    id: "preheat",
    title: "Preheat Oven",
    description: "Heat oven and baking vessel to proper temperature.",
    duration: 60, // 1 hour average
    isActiveTime: false,
    tips: [
      "Preheat to 500°F (260°C) with Dutch oven or baking stone inside",
      "A proper preheat ensures good oven spring",
      "Start preheating about an hour before the end of proofing"
    ]
  },
  {
    id: "score-bake",
    title: "Score & Bake",
    description: "Score the dough and bake until golden brown.",
    duration: 45, // 45 minutes average
    isActiveTime: true,
    tips: [
      "Score with a sharp blade at a 45° angle",
      "Bake covered for 20 minutes, then uncovered for 20-25 minutes",
      "Internal temperature should reach 205-210°F (96-99°C)"
    ]
  },
  {
    id: "cool",
    title: "Cool",
    description: "Allow the bread to cool completely before cutting.",
    duration: 120, // 2 hours average
    isActiveTime: false,
    tips: [
      "Resist cutting into the loaf while hot - the structure is still setting",
      "Place on a wire rack to prevent a soggy bottom",
      "Listen for the bread to 'sing' as it cools - the crust will crackle"
    ]
  }
];

export const getTotalTime = (steps: BreadStep[]): number => {
  return steps.reduce((total, step) => total + step.duration, 0);
};

export const getActiveTime = (steps: BreadStep[]): number => {
  return steps
    .filter(step => step.isActiveTime)
    .reduce((total, step) => total + step.duration, 0);
};
