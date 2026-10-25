import { useState } from "react";
import { ErrorMessage } from "./components/ErrorMessage";
import { RecipeForm } from "./components/RecipeForm";
import { RecipeList } from "./components/RecipeList";
import { findRecipes } from "./services/recipeApi";
import type { Recipe, RecipeRequest } from "./types/recipe";

export default function App() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastRequest, setLastRequest] = useState<RecipeRequest | null>(null);

  async function submitRequest(request: RecipeRequest) {
    setLoading(true);
    setHasError(false);
    setLastRequest(request);
    try {
      const result = await findRecipes(request);
      setRecipes(result.recipes);
    } catch {
      setRecipes([]);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero" id="top">
        <div className="hero-copy">
          <h1>Fridge to<br /><em>Recipes</em></h1>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="sun-shape" /><div className="art-leaf leaf-one" /><div className="art-leaf leaf-two" /><div className="art-leaf leaf-three" /><div className="art-tomato">✳</div></div>
      </section>

      <section className="form-panel" aria-labelledby="form-heading">
        <div className="panel-heading"><div><span className="eyebrow">LET'S GET COOKING</span><h2 id="form-heading">What's in your fridge?</h2></div><span className="step-marker">01 <i>/</i> 02</span></div>
        <RecipeForm ingredients={ingredients} onIngredientsChange={setIngredients} onSubmit={submitRequest} loading={loading} />
      </section>

      {hasError && <ErrorMessage onRetry={() => lastRequest && void submitRequest(lastRequest)} />}
      {loading && <p className="loading-message" role="status">Finding recipes that fit your kitchen<span>…</span></p>}
      {recipes.length > 0 && <RecipeList recipes={recipes} />}
    </main>
  );
}
