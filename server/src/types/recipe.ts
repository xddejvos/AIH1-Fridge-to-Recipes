export type RecipeRequest = {
  ingredients: string[];
  dietary: string;
  cuisine: string;
  maxCookTime?: number;
  servings?: number;
};

export type Ingredient = {
  name: string;
  missing: boolean;
};

export type Recipe = {
  title: string;
  ingredients: Ingredient[];
  instructions: string[];
  estimatedCookTime: number;
  servings?: number;
};

export type RecipeResponse = { recipes: Recipe[] };

export type GeneratedRecipe = Omit<Recipe, "ingredients"> & {
  ingredients: string[];
};
