import test from "node:test";
import assert from "node:assert/strict";
import { generateRecipes } from "./recipeService.js";
import type { RecipeRequest } from "../types/recipe.js";

const request: RecipeRequest = { ingredients: ["chicken", "rice"], dietary: "none", cuisine: "any" };
const providerResponse = () => new Response(JSON.stringify({ output: [{ content: [{ type: "output_text", text: JSON.stringify({ recipes: [1, 2, 3].map((number) => ({
  title: `Recipe ${number}`, ingredients: ["chicken", "soy sauce"], instructions: ["Cook it."], estimatedCookTime: 20, servings: 2
})) }) }] }] }), { status: 200 });

test("parses three recipes and derives available/missing ingredients", async () => {
  const result = await generateRecipes(request, "test-key", async () => providerResponse());
  assert.equal(result.recipes.length, 3);
  assert.deepEqual(result.recipes[0].ingredients, [{ name: "chicken", missing: false }, { name: "soy sauce", missing: true }]);
});

test("retries one transient provider failure", async () => {
  let calls = 0;
  const result = await generateRecipes(request, "test-key", async () => {
    calls += 1;
    return calls === 1 ? new Response("busy", { status: 503 }) : providerResponse();
  });
  assert.equal(calls, 2);
  assert.equal(result.recipes.length, 3);
});

test("retries a rate-limit 429 once", async () => {
  let calls = 0;
  const result = await generateRecipes(request, "test-key", async () => {
    calls += 1;
    return calls === 1
      ? new Response(JSON.stringify({ error: { code: "rate_limit_exceeded" } }), { status: 429 })
      : providerResponse();
  });
  assert.equal(calls, 2);
  assert.equal(result.recipes.length, 3);
});

test("does not retry a 429 caused by exhausted API credits", async () => {
  let calls = 0;
  await assert.rejects(generateRecipes(request, "test-key", async () => {
    calls += 1;
    return new Response(JSON.stringify({ error: { code: "credit_balance_exhausted" } }), { status: 429 });
  }), /HTTP 429 \(credit_balance_exhausted\)/);
  assert.equal(calls, 1);
});

test("does not retry permanent client errors", async () => {
  let calls = 0;
  await assert.rejects(generateRecipes(request, "test-key", async () => {
    calls += 1;
    return new Response("bad request", { status: 400 });
  }), /HTTP 400/);
  assert.equal(calls, 1);
});
