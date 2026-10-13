import type { FormEvent } from "react";
import type { RecipeRequest } from "../types/recipe";
import { IngredientInput } from "./IngredientInput";

type RecipeFormProps = {
  ingredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
  onSubmit: (request: RecipeRequest) => void;
  loading: boolean;
};

export function RecipeForm({ ingredients, onIngredientsChange, onSubmit, loading }: RecipeFormProps) {
  function addIngredient(ingredient: string) {
    if (!ingredients.some((item) => item.toLocaleLowerCase() === ingredient.toLocaleLowerCase())) {
      onIngredientsChange([...ingredients, ingredient]);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const maxCookTime = Number(data.get("maxCookTime"));
    const servings = Number(data.get("servings"));
    onSubmit({
      ingredients,
      dietary: String(data.get("dietary")),
      cuisine: String(data.get("cuisine")),
      ...(maxCookTime > 0 ? { maxCookTime } : {}),
      ...(servings > 0 ? { servings } : {})
    });
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit}>
      <IngredientInput ingredients={ingredients} onAdd={addIngredient} onRemove={(removed) => onIngredientsChange(ingredients.filter((item) => item !== removed))} disabled={loading} />
      <div className="filter-grid">
        <label className="field">
          <span className="field-label">Dietary restriction</span>
          <select name="dietary" disabled={loading}>
            <option value="none">No restrictions</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="gluten-free">Gluten-free</option>
            <option value="dairy-free">Dairy-free</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Cuisine</span>
          <select name="cuisine" disabled={loading}>
            <option value="any">Any cuisine</option>
            <option value="asian">Asian</option>
            <option value="italian">Italian</option>
            <option value="mexican">Mexican</option>
            <option value="mediterranean">Mediterranean</option>
            <option value="indian">Indian</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Maximum cooking time (min)</span>
          <input name="maxCookTime" type="number" min="1" step="1" placeholder="30" disabled={loading} />
        </label>
        <label className="field">
          <span className="field-label">Servings</span>
          <input name="servings" type="number" min="1" step="1" placeholder="2" disabled={loading} />
        </label>
      </div>
      <button className="submit-button" type="submit" disabled={loading || ingredients.length === 0}>
        {loading ? "Finding recipes..." : "Find Recipes"}
        {!loading && <span aria-hidden="true">→</span>}
      </button>
      {ingredients.length === 0 && <p className="form-hint">Add at least one ingredient to get started.</p>}
    </form>
  );
}
