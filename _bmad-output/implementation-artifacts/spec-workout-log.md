---
title: 'Workout Log — History + Create with Per-Set Tracking'
type: 'feature'
created: '2026-05-17'
status: 'done'
baseline_commit: '9f24b87'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Workouts page is a placeholder. Users cannot log training sessions or see their history.

**Approach:** Replace the placeholder with a functional workout log page: a collapsible creation form where users build a workout exercise-by-exercise (each exercise tracks individual sets with reps + weight + unit + optional note), and a scrollable history of past workouts stored in Firestore.

## Boundaries & Constraints

**Always:**
- Data path: `users/{uid}/workouts/{workoutId}` — uid from `useAuth().user.uid`
- Each exercise tracks **individual sets** — not just a total count. Each set has `reps: number` and `weight: number`.
- Unit (kg / lbs) is per-exercise and persists in Firestore.
- Workouts are ordered by date descending in the history.
- Date is auto-set to the current timestamp on save — no manual date picker in this spec.
- Use Firestore `addDoc` / `onSnapshot` — real-time history updates after save.

**Ask First:**
- Whether to add a delete-workout feature (not in scope unless confirmed).

**Never:**
- No editing of past workouts in this spec.
- No pagination — load all workouts for now (defer when collection grows large).
- No workout templates or plan section — deferred to next story.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Save workout | Valid name + ≥1 exercise + ≥1 set | Saved to Firestore, form closes, appears in history | — |
| Save with empty name | Form submitted, name field blank | Prevented by HTML `required` | — |
| Save with no exercises | 0 exercises added | Button disabled or inline validation | "Mindestens eine Übung erforderlich" |
| Save with exercise but no sets | Exercise added, no sets | Button disabled / inline validation | "Mindestens ein Satz erforderlich" |
| Empty history | No workouts in Firestore | Empty-state message visible | — |
| Firestore write fails | Network error on save | Inline error below save button | "Speichern fehlgeschlagen. Bitte versuche es erneut." |
| Weight input non-numeric | User types letters | Input type=number prevents it natively | — |

</frozen-after-approval>

## Code Map

- `src/pages/Workouts.tsx` — UPDATE: replace placeholder with full page
- `src/types/workout.ts` — NEW: Workout, Exercise, Set TypeScript types
- `src/lib/workouts.ts` — NEW: Firestore helpers (saveWorkout, subscribeToWorkouts)
- `src/lib/firebase.ts` — existing: exports `db` and `auth`

## Tasks & Acceptance

**Execution:**
- [x] `src/types/workout.ts` -- CREATE: `WorkoutSet`, `WorkoutExercise`, `Workout` interfaces; `Unit` type (`'kg' | 'lbs'`)
- [x] `src/lib/workouts.ts` -- CREATE: `saveWorkout(uid, data)` using `addDoc`; `subscribeToWorkouts(uid, callback)` using `onSnapshot` ordered by date desc
- [x] `src/pages/Workouts.tsx` -- REPLACE: full page with three sections — create-form toggle button, collapsible workout form, history list; use `useAuth` for uid; call `subscribeToWorkouts` in `useEffect` with cleanup

**Acceptance Criteria:**
- Given logged-in user, when they open Workouts, then past workouts load in real-time ordered newest-first
- Given empty history, when user opens Workouts, then a "Noch keine Workouts" empty state is shown
- Given user clicks "Neues Workout", when the form opens, then they can add exercises and per-set reps/weight/unit/note
- Given user adds an exercise, when they click "+ Satz", then a new set row (reps + weight) appears
- Given form is complete, when user saves, then workout appears in history immediately without page reload
- Given save fails, when Firestore returns an error, then an error message appears and form stays open
- Given no exercises or sets, when user tries to save, then save is blocked with a validation message

## Design Notes

Data shape written to Firestore:
```ts
{
  name: string,
  date: Timestamp,        // serverTimestamp()
  exercises: [{
    name: string,
    unit: 'kg' | 'lbs',
    notes: string,         // empty string if not filled
    sets: [{ reps: number, weight: number }]
  }]
}
```

Page layout (top to bottom):
1. `[+ Neues Workout]` button — toggles form visibility
2. Collapsible form (shown when active): workout name → exercise list → per-exercise set rows → Save button
3. History section: workout cards ordered newest-first

Form state lives in local React state only — not persisted until saved.

## Verification

**Commands:**
- `pnpm build` -- expected: no TypeScript errors

**Manual checks:**
- Add workout with 2 exercises (3 sets each) → appears in history immediately
- Reload page → history persists (data from Firestore)
- Try saving empty form → blocked
- Switch unit kg↔lbs per exercise → saves correctly

## Suggested Review Order

**Datenmodell & Firestore**

- TypeScript-Typen: WorkoutSet, WorkoutExercise, Workout, Unit
  [`workout.ts:1`](../../src/types/workout.ts#L1)

- Firestore-Helpers: saveWorkout (addDoc + serverTimestamp) und subscribeToWorkouts (onSnapshot + orderBy)
  [`workouts.ts:1`](../../src/lib/workouts.ts#L1)

**Seitenstruktur & State**

- useEffect-Subscription mit Cleanup; canSave-Validierung
  [`Workouts.tsx:54`](../../src/pages/Workouts.tsx#L54)

- Formular-Toggle und Reset-Logik
  [`Workouts.tsx:64`](../../src/pages/Workouts.tsx#L64)

**Formular: Übungen & Sätze**

- updateExercise / updateSet: immutable state updates über Index
  [`Workouts.tsx:74`](../../src/pages/Workouts.tsx#L74)

- addSet / removeSet / addExercise / removeExercise
  [`Workouts.tsx:87`](../../src/pages/Workouts.tsx#L87)

**UI-Rendering**

- Validierungsmeldungen und gesperrter Save-Button
  [`Workouts.tsx:247`](../../src/pages/Workouts.tsx#L247)

- WorkoutCard: formatDate mit null-Guard, Set-Badges
  [`Workouts.tsx:20`](../../src/pages/Workouts.tsx#L20)

## Spec Change Log
