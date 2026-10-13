# Fridge to Recipes

A small full-stack app that turns ingredients you already have into exactly three recipe ideas. Add ingredients, choose optional dietary and cuisine preferences, and set a maximum cooking time or serving count.

## Technologies

- Frontend: React, TypeScript, Vite, plain CSS
- Backend: Node.js, Express, TypeScript
- Recipe generation: OpenAI Responses API, called only by the backend

## Prerequisites

- Node.js 20 or newer and npm
- An OpenAI API key with access to the `gpt-4.1-mini` model

## Installation

Open two terminals from the project root and install each app's dependencies:

```bash
cd server
npm install
```

```bash
cd client
npm install
```

## Environment setup

Copy `server/.env.example` to `server/.env` and set your key:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

`OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`; set it to another model ID available to your API project to switch models. Restart the backend after changing `server/.env`. The server also optionally accepts `PORT` (defaults to `3001`) and `CLIENT_ORIGIN` (defaults to `http://localhost:5173`). The API key is read by the server and must never be added to client files or a `VITE_` variable. `server/.env` is ignored by Git.

## Start the backend

```bash
cd server
npm run dev
```

The API listens at `http://localhost:3001`.

## Start the frontend

In a second terminal:

```bash
cd client
npm run dev
```

Open the Vite address shown in the terminal (normally `http://localhost:5173`). Vite forwards `/api` requests to the backend.

## Example request

Input:

- Ingredients: chicken, rice, onion
- Dietary restriction: none
- Cuisine: Asian
- Maximum cooking time: 30 minutes
- Servings: 2

Equivalent request:

```json
{
  "ingredients": ["chicken", "rice", "onion"],
  "dietary": "none",
  "cuisine": "asian",
  "maxCookTime": 30,
  "servings": 2
}
```

Send it to `POST http://localhost:3001/api/recipes` with `Content-Type: application/json`.

## Example output

The live model may phrase recipes differently. A shortened response has this shape and contains exactly three recipe entries:

```json
{
  "recipes": [
    {
      "title": "Chicken Fried Rice",
      "ingredients": [
        { "name": "chicken", "missing": false },
        { "name": "rice", "missing": false },
        { "name": "onion", "missing": false },
        { "name": "soy sauce", "missing": true }
      ],
      "instructions": ["Cook the rice.", "Fry the chicken and onion.", "Stir in rice and soy sauce."],
      "estimatedCookTime": 25,
      "servings": 2
    },
    {
      "title": "Ginger Chicken Rice Bowl",
      "ingredients": [{ "name": "chicken", "missing": false }, { "name": "rice", "missing": false }, { "name": "ginger", "missing": true }],
      "instructions": ["Cook the rice.", "Sauté chicken with ginger.", "Serve together."],
      "estimatedCookTime": 25,
      "servings": 2
    },
    {
      "title": "Savory Chicken and Onion Rice",
      "ingredients": [{ "name": "chicken", "missing": false }, { "name": "onion", "missing": false }, { "name": "rice", "missing": false }, { "name": "sesame oil", "missing": true }],
      "instructions": ["Prepare the rice.", "Brown chicken and onion.", "Combine and serve."],
      "estimatedCookTime": 30,
      "servings": 2
    }
  ]
}
```

The `missing` value is calculated by the backend from the submitted ingredient list; it is not taken from the model.

## Error handling and retry

The backend validates every request and returns HTTP 400 for invalid input. It calls the external API once, then waits 300 ms and retries once after a network failure or transient HTTP 429, 500, 502, 503, or 504 response. A 429 response that identifies exhausted credits or a spend limit is not retried; its error code is included in the backend log. Other permanent client errors are not retried. A failed provider call or malformed response becomes a friendly HTTP 502 response; a missing server API key returns HTTP 503. The frontend shows an error and a retry button and prevents duplicate submissions while a request is running.

## Tests and build

```bash
cd server
npm test
npm run build
```

```bash
cd client
npm run build
```
