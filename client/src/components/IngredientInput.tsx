import { useState, type KeyboardEvent } from "react";

type IngredientInputProps = {
  ingredients: string[];
  onAdd: (ingredient: string) => void;
  onRemove: (ingredient: string) => void;
  disabled: boolean;
};

export function IngredientInput({ ingredients, onAdd, onRemove, disabled }: IngredientInputProps) {
  const [value, setValue] = useState("");

  function addCurrentIngredient() {
    const ingredient = value.trim();
    if (ingredient) {
      onAdd(ingredient);
      setValue("");
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addCurrentIngredient();
    }
  }

  return (
    <div>
      <label className="field-label" htmlFor="ingredient-input">Ingredients you have</label>
      <div className="ingredient-entry">
        <input
          id="ingredient-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="e.g. chicken"
          disabled={disabled}
          autoComplete="off"
          onKeyDown={handleKeyDown}
        />
        <button className="add-button" type="button" aria-label="Add ingredient" onClick={addCurrentIngredient} disabled={disabled}>+</button>
      </div>
      <div className="ingredient-tags" aria-live="polite">
        {ingredients.map((ingredient) => (
          <span className="ingredient-tag" key={ingredient}>
            {ingredient}
            <button type="button" onClick={() => onRemove(ingredient)} aria-label={`Remove ${ingredient}`} disabled={disabled}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
}
