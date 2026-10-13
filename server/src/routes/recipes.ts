import { Router } from "express";
import { generateRecipes } from "../services/recipeService.js";
import type { RecipeRequest } from "../types/recipe.js";

export const recipesRouter = Router();

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateRecipeRequest(value: unknown): { request?: RecipeRequest; error?: string } {
  if (!isRecord(value)) {
    return { error: "Request body must be an object." };
  }
  const body = value;
  const rawIngredients = body.ingredients;
  if (!Array.isArray(rawIngredients) || rawIngredients.length === 0
    || !rawIngredients.every(isNonEmptyString)) {
    return { error: "Add at least one non-empty ingredient." };
  }
  if ((body.maxCookTime !== undefined && !isPositiveInteger(body.maxCookTime))
    || (body.servings !== undefined && !isPositiveInteger(body.servings))) {
    return { error: "Cooking time and servings must be positive whole numbers." };
  }
  if ((body.dietary !== undefined && typeof body.dietary !== "string")
    || (body.cuisine !== undefined && typeof body.cuisine !== "string")) {
    return { error: "Dietary restriction and cuisine must be text." };
  }

  const uniqueIngredients = new Map<string, string>();
  for (const ingredient of rawIngredients) {
    const name = ingredient.trim();
    const key = name.toLocaleLowerCase();
    if (!uniqueIngredients.has(key)) uniqueIngredients.set(key, name);
  }
  return {
    request: {
      ingredients: [...uniqueIngredients.values()],
      dietary: typeof body.dietary === "string" ? body.dietary : "none",
      cuisine: typeof body.cuisine === "string" ? body.cuisine : "any",
      ...(typeof body.maxCookTime === "number" ? { maxCookTime: body.maxCookTime } : {}),
      ...(typeof body.servings === "number" ? { servings: body.servings } : {})
    }
  };
}

recipesRouter.post("/", async (req, res) => {
  const validation = validateRecipeRequest(req.body);
  if (!validation.request) {
    res.status(400).json({ error: validation.error });
    return;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Recipe generation is not configured on the server." });
    return;
  }
  try {
    res.json(await generateRecipes(validation.request, apiKey));
  } catch (error) {
    console.error("Recipe generation failed:", error instanceof Error ? error.message : "Unknown error");
    res.status(502).json({ error: "We couldn't generate recipes. Please try again." });
  }
});
