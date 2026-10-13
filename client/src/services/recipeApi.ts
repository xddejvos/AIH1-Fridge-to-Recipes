import type { RecipeRequest, RecipeResponse } from "../types/recipe";

export async function findRecipes(request: RecipeRequest): Promise<RecipeResponse> {
  const response = await fetch("/api/recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });

  if (!response.ok) throw new Error("We couldn't generate recipes. Please try again.");
  return response.json() as Promise<RecipeResponse>;
}
