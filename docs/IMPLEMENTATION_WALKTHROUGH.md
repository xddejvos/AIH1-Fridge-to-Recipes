# Implementation walkthrough

This guide follows one request from the form to the recipe cards. Paths are relative to the project root.

## 1. Frontend request flow

### `client/src/App.tsx`

`App` is the page-level component. It owns state shared by the form and result area:

- `ingredients` stores the ingredient tags.
- `recipes` stores the last successful response.
- `loading` disables form actions while a request is in flight.
- `hasError` controls the error message.
- `lastRequest` lets Retry repeat the last submitted values.

When the user submits the form, `submitRequest` sets loading, remembers the submitted values, and awaits `findRecipes`. A successful response replaces `recipes`. A failure clears stale results and displays the retry message. `finally` always resets loading, even when the request fails. The page conditionally renders the error, loading message, and result list from those state values.

### `client/src/components/RecipeForm.tsx`

The form contains ingredient tags and four optional filters. `addIngredient` trims values in the input component and compares case-insensitively before adding them, which prevents tags such as `Rice` and `rice` from both being added. The form submit handler reads select and number fields with `FormData`, then sends a `RecipeRequest` object to `App` through `onSubmit`.

`Number(...)` converts the optional number fields from strings. A positive value is included in the request; blank fields become zero and are omitted. The number inputs use `min="1"` and `step="1"`, while the backend independently checks that provided values are positive integers.

### `client/src/components/IngredientInput.tsx`

This component owns only the text currently being typed. Clicking **+** or pressing Enter calls `addCurrentIngredient`; whitespace-only text is ignored, and successful additions clear the input. Each chip has a button that calls `onRemove` with that ingredient. The input component uses a `div` rather than nesting a second HTML form inside the main form.

### `client/src/services/recipeApi.ts`

`findRecipes` uses the browser's built-in `fetch` to POST JSON to `/api/recipes`. Vite proxies that path to Express during local development. A non-success HTTP status becomes a rejected promise, which `App` turns into the friendly error state. The browser does not receive or need the AI key.

### `client/src/components/RecipeList.tsx` and `RecipeCard.tsx`

`RecipeList` maps each returned recipe to a card. `RecipeCard` separates ingredients by the server's `missing` boolean, then renders the steps as an ordered list. Green chips indicate ingredients in the user's list; warm-colored chips indicate ingredients to get. Cook time is always displayed, while servings are displayed when present.

### `client/src/components/ErrorMessage.tsx`

The message uses `role="alert"` so assistive technology can announce the failure. Its Retry button asks `App` to submit the saved request again.

## 2. Backend request flow

### `server/src/index.ts`

This is the Express entry point. `dotenv/config` loads `server/.env` into the server process. Express then enables the configured local CORS origin, parses small JSON request bodies, mounts the recipe router at `/api/recipes`, and starts listening on port 3001 unless `PORT` overrides it.

### `server/src/routes/recipes.ts`

`validateRecipeRequest` accepts `unknown` because an HTTP body is untrusted input. It checks the object shape, requires one or more non-empty ingredient strings, checks optional positive integer values, and checks the types of the optional text fields. It trims ingredients and removes case-insensitive duplicates while preserving the first spelling. Invalid input returns HTTP 400 before any external call.

The POST route checks for `OPENAI_API_KEY` on the server. If it is missing, the route returns HTTP 503 without attempting generation. Otherwise, it awaits `generateRecipes` and sends the normalized response. Provider or parsing errors are logged without returning provider details to the browser, then translated to a friendly HTTP 502 response. The model is read from `OPENAI_MODEL`, defaulting to `gpt-4.1-mini`.

### `server/src/services/recipeService.ts`

`generateRecipes` builds a text prompt from ingredients and optional constraints and sends it to `https://api.openai.com/v1/responses`. The bearer token is set only in this server-side request. The request asks for JSON matching a schema with exactly three recipe objects; OpenAI documents this JSON Schema output format in its [Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs).

The retry loop makes at most two requests. It waits 300 ms and retries once for a network exception or transient HTTP 429, 500, 502, 503, or 504. A 429 body with a known billing or exhausted-credit code is logged with that code and is not retried, because retrying cannot restore credits. Other HTTP failures, such as 400, exit immediately. The loop does not retry malformed model output because that is not a transient HTTP/network failure.

After a successful HTTP response, `getOutputText` finds the model's text block. `JSON.parse` produces untrusted data, so `parseRecipes` checks that there are exactly three recipes and that their titles, ingredient names, instructions, time, and optional servings have the expected shapes. `normalizeRecipes` builds a lowercase set from the user's ingredient names and computes each ingredient's `missing` flag. For example, if the user sent `rice`, a generated `rice` has `missing: false`, while `soy sauce` has `missing: true`.

### `server/src/types/recipe.ts` and `client/src/types/recipe.ts`

These files define the data exchanged between layers. `RecipeRequest` describes form values; `Ingredient` and `Recipe` describe normalized output; and `RecipeResponse` wraps the recipe array. The server also has `GeneratedRecipe`, whose ingredient names are plain strings before the server adds the `missing` flag. Keeping these types close to each app makes the boundary explicit without adding shared-package tooling to this small homework project.

## 3. Styling and project configuration

- `client/src/styles.css` provides the plain CSS layout. A CSS grid displays three cards on desktop and one column on narrow screens.
- `client/src/main.tsx` finds the HTML root element and mounts React. It reports a clear startup error if the root element is missing.
- `client/index.html` supplies the document shell and page title; `client/vite.config.ts` sets the React plugin and local `/api` proxy.
- `client/package.json` and `client/tsconfig.json` define the Vite scripts and strict frontend TypeScript build.
- `server/package.json` and `server/tsconfig.json` define the Express development, test, and production build commands.
- `.gitignore` excludes dependency folders, build output, and environment files. `server/.env.example` shows the expected key name without including a real secret.
- `README.md` has setup steps, an example request and response, and a description of error and retry behavior.

## 4. Tests and manual reconstruction

`server/src/routes/recipes.test.ts` checks invalid input, defaults, and duplicate removal. `server/src/services/recipeService.test.ts` supplies fake `fetch` responses to test recipe parsing, server-derived missing flags, retry after transient HTTP 503 and 429, no retry for exhausted credits, and no retry after HTTP 400. These tests do not require a real API key or create paid provider requests.

To rebuild the feature yourself, first write the request and response types. Next validate the incoming HTTP body, then make a small provider service that returns parsed recipes. Normalize the model's output at the backend boundary so the browser receives a simple, stable shape. Finally, connect a controlled React form to the API helper, model loading/error/success as state, and render the typed response. Test the validation and retry rules by injecting a fake `fetch` function instead of calling the live provider.
