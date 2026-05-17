---
title: 'Workout Templates — Create, Pick, and Apply to Workout Form'
type: 'feature'
created: '2026-05-17'
status: 'done'
baseline_commit: '70a01ad'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users must re-enter exercise names and set counts on every workout. There is no way to reuse a training structure.

**Approach:** Add a template system to the Workouts page. Templates define exercise names, unit (kg/lbs), and sets with target reps. A dedicated "Aus Template starten" button opens a picker that pre-fills the workout form. Templates are created at the bottom of the page via a separate collapsible form.

## Boundaries & Constraints

**Always:**
- Template data path: `users/{uid}/workoutTemplates/{templateId}`
- Template shape: `{ name, exercises: [{ name, unit, sets: [{ targetReps?: number }] }] }`
- Applying a template: copies exercise names + unit into the workout form; each set gets `reps = targetReps ?? 0`, `weight = 0` (user fills in actual values during session).
- "Aus Template starten" button sits beside "+ Neues Workout" at the top of the page.
- Clicking "Aus Template starten" with no templates shows a message: "Noch keine Templates. Erstelle unten dein erstes Template."
- The template picker is a dropdown list directly below the button (no modal/dialog).
- Template creation form is at the **bottom** of the page, toggled by a "+ Template erstellen" button.
- Templates are listed above the creation form in the bottom section.

**Ask First:**
- Whether to add template deletion (not in scope unless confirmed).

**Never:**
- No editing of existing templates in this spec.
- No reordering of templates.
- Template picker does not close the workout form if already open — it replaces the form content.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Apply template | User selects a template | Workout form opens with pre-filled exercises; reps = targetReps, weight = 0 | — |
| Apply template when form already open | Form has user data | Form content is replaced with template data | — |
| No templates exist | Click "Aus Template starten" | Dropdown shows "Noch keine Templates..." message | — |
| Save template | Valid name + ≥1 exercise + ≥1 set | Saved to Firestore, appears in template list | — |
| Save template with no exercises | 0 exercises | Save blocked, "Mindestens eine Übung erforderlich." | — |
| Save template with exercise but no sets | ≥1 exercise, 0 sets | Save blocked, "Mindestens ein Satz pro Übung erforderlich." | — |
| Firestore write fails | Network error | "Speichern fehlgeschlagen. Bitte versuche es erneut." below template save button | — |

</frozen-after-approval>

## Code Map

- `src/types/workout.ts` — ADD: `TemplateSet`, `TemplateExercise`, `WorkoutTemplate` interfaces
- `src/lib/workoutTemplates.ts` — NEW: `saveTemplate`, `subscribeToTemplates` (Firestore helpers)
- `src/pages/Workouts.tsx` — UPDATE: add template picker, apply-template logic, bottom template section

## Tasks & Acceptance

**Execution:**
- [x] `src/types/workout.ts` -- ADD: `TemplateSet { targetReps?: number }`, `TemplateExercise { name, unit, sets: TemplateSet[] }`, `WorkoutTemplate { id, name, exercises }`
- [x] `src/lib/workoutTemplates.ts` -- CREATE: `saveTemplate(uid, name, exercises)` using `addDoc`; `subscribeToTemplates(uid, callback)` using `onSnapshot` ordered by name asc
- [x] `src/pages/Workouts.tsx` -- UPDATE: (1) add `templates` state + subscription in `useEffect`; (2) add "Aus Template starten" button with dropdown picker; (3) add `applyTemplate(t)` function that populates workout form state from template; (4) add bottom "Templates" section with list + collapsible creation form

**Acceptance Criteria:**
- Given user clicks "Aus Template starten" with no templates, when the picker opens, then "Noch keine Templates. Erstelle unten dein erstes Template." is shown
- Given user clicks "Aus Template starten" with templates, when the picker opens, then a list of template names is shown
- Given user selects a template, when the template is applied, then the workout form opens pre-filled with the template's exercises; reps equal targetReps if set, otherwise 0; weight fields are always 0
- Given user already has data in the form, when they apply a template, then the form content is replaced
- Given user fills in the template creation form and saves, when save succeeds, then template appears in the bottom list immediately
- Given template creation form has no exercises or no sets, when user tries to save, then save is blocked with the appropriate message

## Design Notes

Template creation form state is independent from workout form state. Both can be managed in the same component with separate state variables (prefix `tmpl*` for template form state).

`applyTemplate`:
```ts
function applyTemplate(t: WorkoutTemplate) {
  setWorkoutName(t.name);
  setExercises(t.exercises.map(ex => ({
    name: ex.name,
    unit: ex.unit,
    notes: "",
    sets: ex.sets.map(s => ({ reps: s.targetReps ?? 0, weight: 0 })),
  })));
  setShowForm(true);
  setShowTemplatePicker(false);
}
```

Template creation form mirrors the workout creation form but replaces the per-set reps+weight pair with a single optional `targetReps` number input (placeholder "Ziel-Wdh (optional)").

## Verification

**Commands:**
- `pnpm build` -- expected: no TypeScript errors

**Manual checks:**
- Create a template "Push Day" with Bankdrücken 4×8, Schulterdrücken 3×10
- Click "Aus Template starten" → see "Push Day" in picker → click it
- Form opens with Bankdrücken (4 set rows, reps=8, weight=0) and Schulterdrücken (3 rows, reps=10, weight=0)
- Fill in weights and save → appears in history

## Suggested Review Order

**Datenmodell**

- TemplateSet (optional targetReps), TemplateExercise, WorkoutTemplate — Typen
  [`workout.ts:20`](../../src/types/workout.ts#L20)

- saveTemplate: undefined-Bereinigung vor Firestore-Write
  [`workoutTemplates.ts:5`](../../src/lib/workoutTemplates.ts#L5)

- subscribeToTemplates: onSnapshot orderBy name asc
  [`workoutTemplates.ts:22`](../../src/lib/workoutTemplates.ts#L22)

**Template-Picker & Apply-Logik**

- Beide Subscriptions in einem useEffect mit doppeltem Cleanup
  [`Workouts.tsx:134`](../../src/pages/Workouts.tsx#L134)

- Outside-click Handler via pickerRef (ref umschließt Button + Dropdown)
  [`Workouts.tsx:141`](../../src/pages/Workouts.tsx#L141)

- applyTemplate: mappt Template → WorkoutExercise (targetReps ?? 0, weight 0)
  [`Workouts.tsx:180`](../../src/pages/Workouts.tsx#L180)

- Picker-Dropdown: leerer Zustand vs. Template-Liste
  [`Workouts.tsx:236`](../../src/pages/Workouts.tsx#L236)

**Template-Erstellung (Bottom Section)**

- SetRow shared component: showWeight=false für Template-Form (nur Ziel-Wdh)
  [`Workouts.tsx:66`](../../src/pages/Workouts.tsx#L66)

- Template-Creation-Form mit eigenem tmpl*-State; canSaveTmpl-Validierung
  [`Workouts.tsx:382`](../../src/pages/Workouts.tsx#L382)

## Spec Change Log
