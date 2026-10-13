import type { Recipe } from "../types/recipe";
import { RecipeCard } from "./RecipeCard";

export function RecipeList({ recipes }: { recipes: Recipe[] }) {
  return (
    <section className="results" aria-labelledby="results-heading">
      <div className="results-heading">
        <div><span className="eyebrow">MADE FOR YOUR FRIDGE</span><h2 id="results-heading">Your recipe ideas</h2></div>
        <span className="results-count">{recipes.length} recipes</span>
      </div>
      <div className="recipe-grid">{recipes.map((recipe, index) => <RecipeCard key={`${index}-${recipe.title}`} recipe={recipe} index={index} />)}</div>
    </section>
  );
}
