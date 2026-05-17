---
title: 'Recipes — List with Search, Detail Page, Rating and Delete'
type: 'feature'
created: '2026-05-17'
status: 'done'
baseline_commit: '294089d'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Recipes page is a placeholder. Users cannot create, browse or manage recipes.

**Approach:** A personal recipe book. The list page shows all recipes with a search bar and a "+ Rezept erstellen" form. Each recipe card links to a dedicated detail page (`/recipes/:id`) showing the full recipe. On the detail page the user can rate (1–5 stars) and delete the recipe. AI-assisted recipe generation is deferred.

## Boundaries & Constraints

**Always:**
- Data path: `users/{uid}/recipes/{recipeId}`
- Recipe fields: `title, ingredients, instructions, calories, protein, carbs, fat, portions, tags: string[], rating: number (0 = unrated), createdAt: Timestamp`
- Search filters on the client by `title` (case-insensitive substring match).
- Detail page route: `/recipes/:id` — uses `onSnapshot` on a single doc for real-time updates.
- Rating is stored directly on the recipe document (`rating` field, 1–5). Saving a new rating overwrites the old one via `updateDoc`.
- Delete uses `deleteDoc` and navigates back to `/recipes` on success.
- Confirm before delete: a visible "Wirklich löschen?" inline confirmation (no browser dialog).
- `calories`, `protein`, `carbs`, `fat`, `portions` default to 0 if left blank.
- Tags: fixed set of options — Frühstück, Mittagessen, Abendessen, Snack, Bulking, Cutting, Dessert. Multi-select via toggleable chips.

**Ask First:**
- Whether to add editing of existing recipes (not in scope).

**Never:**
- No AI generation in this spec (deferred).
- No image upload.
- No shared/public recipes — all under `users/{uid}`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Create recipe | Title + ingredients + instructions (all required) | Saved, appears in list, form resets | — |
| Create with optional fields blank | No calories / tags | Saved with defaults (0 / []) | — |
| Search | User types in search bar | List filters in real-time, client-side | — |
| No search results | Query matches nothing | "Keine Rezepte gefunden." | — |
| Empty recipe list | No recipes yet | "Noch keine Rezepte. Erstelle dein erstes!" | — |
| Rate recipe | Tap 1–5 stars | Rating saved to Firestore, stars update | — |
| Delete recipe | Confirm tapped | Recipe deleted, navigate to /recipes | — |
| Delete cancelled | "Abbrechen" tapped | Nothing deleted, confirmation hidden | — |
| Recipe not found | Direct URL to deleted id | "Rezept nicht gefunden." + back link | — |

</frozen-after-approval>

## Code Map

- `src/types/recipe.ts` — NEW: `Recipe` interface
- `src/lib/recipes.ts` — NEW: `saveRecipe`, `subscribeToRecipes`, `subscribeToRecipe`, `updateRating`, `deleteRecipe`
- `src/pages/Recipes.tsx` — UPDATE: list + search + create form + recipe cards with links
- `src/pages/RecipeDetail.tsx` — NEW: detail view, star rating, delete with confirm
- `src/App.tsx` — UPDATE: add `<Route path="/recipes/:id" element={<ProtectedRoute><RecipeDetail /></ProtectedRoute>} />`

## Tasks & Acceptance

**Execution:**
- [x] `src/types/recipe.ts` -- CREATE: `Recipe` interface with all fields
- [x] `src/lib/recipes.ts` -- CREATE: `saveRecipe`, `subscribeToRecipes` (ordered by createdAt desc), `subscribeToRecipe(uid, id, cb)`, `updateRating(uid, id, rating)`, `deleteRecipe(uid, id)`
- [x] `src/pages/RecipeDetail.tsx` -- CREATE: loads recipe by id from URL param; shows all fields; 5-star rating UI; inline delete confirmation
- [x] `src/pages/Recipes.tsx` -- UPDATE: add search input, replace placeholder content with recipe cards (link to detail), add collapsible create form with all fields
- [x] `src/App.tsx` -- UPDATE: add `/recipes/:id` route wrapped in `ProtectedRoute`

**Acceptance Criteria:**
- Given no recipes, when user opens Recipes, then empty state "Noch keine Rezepte. Erstelle dein erstes!" is shown
- Given user creates a recipe, when saved, then it appears in the list immediately
- Given user types in the search bar, when input changes, then list filters in real-time by title
- Given user clicks a recipe card, when navigating to detail, then full recipe (ingredients, instructions, macros, tags) is shown
- Given user taps a star on detail page, when rating is saved, then stars update and reflect the new value
- Given user taps delete, when they confirm, then recipe is deleted and user is sent back to /recipes
- Given user taps delete but cancels, when "Abbrechen" is tapped, then nothing is deleted

## Design Notes

Star rating component:
```tsx
{[1,2,3,4,5].map(n => (
  <button key={n} onClick={() => handleRate(n)}>
    <span className={n <= rating ? "text-yellow-400" : "text-gray-700"}>★</span>
  </button>
))}
```

Recipe card on list page: title, tag chips (small colored pills), rating stars (read-only), calorie info if set.

Ingredients and instructions are free-text `<textarea>` fields — no structured list needed.

`subscribeToRecipe` should handle `!snap.exists()` by calling `onData(null)`.

## Verification

**Commands:**
- `pnpm build` -- expected: no TypeScript errors

**Manual checks:**
- Create "Oatmeal Bowl" → appears in list → click → detail shows correctly
- Rate 4 stars → stars update
- Search "oat" → filters to matching recipes
- Delete → confirm → back on list, recipe gone

## Spec Change Log
