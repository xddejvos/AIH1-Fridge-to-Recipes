import type { Recipe } from "../types/recipe";

export function RecipeCard({ recipe, index }: { recipe: Recipe; index: number }) {
  const available = recipe.ingredients.filter((ingredient) => !ingredient.missing);
  const missing = recipe.ingredients.filter((ingredient) => ingredient.missing);

  return (
    <article className="recipe-card">
      <div className="recipe-number">RECIPE 0{index + 1}</div>
      <h3>{recipe.title}</h3>
      <div className="recipe-meta">
        <span><span aria-hidden="true">◷</span> {recipe.estimatedCookTime} min</span>
        {recipe.servings !== undefined && <span><span aria-hidden="true">♧</span> {recipe.servings} servings</span>}
      </div>
      <div className="recipe-section">
        <h4>Ingredients</h4>
        {available.length > 0 && <ul className="ingredient-list available-list">{available.map((ingredient) => <li key={ingredient.name}><span aria-hidden="true">✓</span>{ingredient.name}</li>)}</ul>}
        {missing.length > 0 && <ul className="ingredient-list missing-list">{missing.map((ingredient) => <li key={ingredient.name}><span aria-hidden="true">+</span>{ingredient.name}</li>)}</ul>}
      </div>
      <div className="recipe-section instructions-section">
        <h4>Method</h4>
        <ol>{recipe.instructions.map((instruction, step) => <li key={`${step}-${instruction}`}>{instruction}</li>)}</ol>
      </div>
    </article>
  );
}
