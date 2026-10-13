import test from "node:test";
import assert from "node:assert/strict";
import { validateRecipeRequest } from "./recipes.js";

test("rejects an empty ingredient list and invalid numeric constraints", () => {
  assert.equal(validateRecipeRequest({ ingredients: [] }).error, "Add at least one non-empty ingredient.");
  assert.equal(validateRecipeRequest({ ingredients: ["rice"], servings: 0 }).error, "Cooking time and servings must be positive whole numbers.");
});

test("normalizes duplicate ingredient tags and applies optional defaults", () => {
  assert.deepEqual(validateRecipeRequest({ ingredients: [" Rice ", "rice", "onion"] }).request, {
    ingredients: ["Rice", "onion"], dietary: "none", cuisine: "any"
  });
});
