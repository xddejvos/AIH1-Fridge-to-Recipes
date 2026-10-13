import type { GeneratedRecipe, Recipe, RecipeRequest, RecipeResponse } from "../types/recipe.js";

const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
const BILLING_ERROR_CODES = new Set([
  "credit_balance_exhausted",
  "insufficient_quota",
  "organization_spend_limit_exceeded",
  "project_spend_limit_exceeded",
  "organization_usage_limit_exceeded",
  "usage_limit_exceeded"
]);
const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

type OpenAIResponse = {
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getProviderErrorCode(value: unknown): string | undefined {
  if (!isRecord(value) || !isRecord(value.error)) return undefined;
  return typeof value.error.code === "string" ? value.error.code : undefined;
}

function parseRecipes(value: unknown): GeneratedRecipe[] {
  if (!isRecord(value) || !Array.isArray(value.recipes) || value.recipes.length !== 3) {
    throw new Error("The recipe service did not return exactly three recipes.");
  }

  return value.recipes.map((item): GeneratedRecipe => {
    if (!isRecord(item) || typeof item.title !== "string" || !item.title.trim()
      || !Array.isArray(item.ingredients) || item.ingredients.length === 0
      || !item.ingredients.every((ingredient) => typeof ingredient === "string" && ingredient.trim())
      || !Array.isArray(item.instructions) || item.instructions.length === 0
      || !item.instructions.every((step) => typeof step === "string" && step.trim())
      || typeof item.estimatedCookTime !== "number" || !Number.isInteger(item.estimatedCookTime)
      || item.estimatedCookTime < 1
      || (item.servings !== undefined && (typeof item.servings !== "number" || !Number.isInteger(item.servings) || item.servings < 1))) {
      throw new Error("The recipe service returned invalid recipe data.");
    }

    return {
      title: item.title.trim(),
      ingredients: item.ingredients.map((ingredient) => ingredient.trim()),
      instructions: item.instructions.map((step) => (step as string).trim()),
      estimatedCookTime: item.estimatedCookTime,
      ...(typeof item.servings === "number" ? { servings: item.servings } : {})
    };
  });
}

function getOutputText(payload: OpenAIResponse): string {
  const text = payload.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === "output_text")?.text;
  if (!text) throw new Error("The recipe service returned an empty response.");
  return text;
}

function normalizeRecipes(recipes: GeneratedRecipe[], availableIngredients: string[]): RecipeResponse {
  const available = new Set(availableIngredients.map((name) => name.trim().toLocaleLowerCase()));
  return {
    recipes: recipes.map((recipe): Recipe => ({
      ...recipe,
      ingredients: recipe.ingredients.map((name) => ({
        name,
        missing: !available.has(name.toLocaleLowerCase())
      }))
    }))
  };
}

export async function generateRecipes(
  request: RecipeRequest,
  apiKey: string,
  fetcher: typeof fetch = fetch
): Promise<RecipeResponse> {
  const prompt = [
    "Create exactly three distinct, practical recipes based on the user's ingredients and constraints.",
    "Include every ingredient needed, as plain ingredient names, and clear numbered cooking instructions.",
    "Respect dietary restrictions and maximum cooking time where possible. Do not claim ingredients are available; the server determines that.",
    `Ingredients available: ${request.ingredients.join(", ")}.`,
    `Dietary restriction: ${request.dietary}. Cuisine: ${request.cuisine}.`,
    `Maximum cooking time: ${request.maxCookTime ?? "not specified"} minutes. Servings: ${request.servings ?? "not specified"}.`
  ].join("\n");
  const body = {
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
    input: [{ role: "user", content: prompt }],
    text: {
      format: {
        type: "json_schema",
        name: "recipe_suggestions",
        strict: true,
        schema: {
          type: "object",
          properties: {
            recipes: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  ingredients: { type: "array", items: { type: "string" } },
                  instructions: { type: "array", items: { type: "string" } },
                  estimatedCookTime: { type: "integer" },
                  servings: { type: "integer" }
                },
                required: ["title", "ingredients", "instructions", "estimatedCookTime", "servings"],
                additionalProperties: false
              }
            }
          },
          required: ["recipes"],
          additionalProperties: false
        }
      }
    }
  };

  let response: Response | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await fetcher("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch (error) {
      if (attempt === 0) {
        await sleep(300);
        continue;
      }
      throw new Error("The recipe provider could not be reached.", { cause: error });
    }

    if (!response.ok) {
      const errorBody: unknown = await response.json().catch(() => undefined);
      const errorCode = getProviderErrorCode(errorBody);
      const isBillingLimit = errorCode !== undefined && BILLING_ERROR_CODES.has(errorCode);
      if (attempt === 0 && TRANSIENT_STATUSES.has(response.status) && !isBillingLimit) {
        await sleep(300);
        continue;
      }
      const codeDetails = errorCode ? ` (${errorCode})` : "";
      throw new Error(`The recipe provider returned HTTP ${response.status}${codeDetails}.`);
    }
    break;
  }

  if (!response?.ok) throw new Error("The recipe provider request failed.");
  const payload: unknown = await response.json();
  if (!isRecord(payload)) throw new Error("The recipe service returned invalid data.");
  const generatedData: unknown = JSON.parse(getOutputText(payload));
  const recipes = parseRecipes(generatedData);
  return normalizeRecipes(recipes, request.ingredients);
}
