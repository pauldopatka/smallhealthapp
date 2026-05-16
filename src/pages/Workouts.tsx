import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { saveWorkout, subscribeToWorkouts } from "@/lib/workouts";
import type { Workout, WorkoutExercise, WorkoutSet, Unit } from "@/types/workout";

// ── helpers ──────────────────────────────────────────────────────────────────

function emptySet(): WorkoutSet { return { reps: 0, weight: 0 }; }
function emptyExercise(): WorkoutExercise {
  return { name: "", unit: "kg", notes: "", sets: [emptySet()] };
}

function formatDate(ts: { toDate?: () => Date } | null | undefined): string {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

// ── sub-components ────────────────────────────────────────────────────────────

function WorkoutCard({ workout }: { workout: Workout }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">{workout.name}</h3>
        <span className="text-gray-500 text-xs">{formatDate(workout.date)}</span>
      </div>
      <div className="space-y-2">
        {workout.exercises.map((ex, i) => (
          <div key={i} className="text-sm">
            <span className="text-gray-300 font-medium">{ex.name}</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {ex.sets.map((s, j) => (
                <span key={j} className="bg-gray-800 text-gray-400 rounded px-2 py-0.5 text-xs">
                  {s.reps} × {s.weight} {ex.unit}
                </span>
              ))}
            </div>
            {ex.notes && <p className="text-gray-600 text-xs mt-1">{ex.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Workouts() {
  const { user } = useAuth();
  const uid = user!.uid;

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([emptyExercise()]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    return subscribeToWorkouts(uid, setWorkouts);
  }, [uid]);

  // ── form helpers ────────────────────────────────────────────

  function resetForm() {
    setWorkoutName("");
    setExercises([emptyExercise()]);
    setSaveError("");
    setShowForm(false);
  }

  function updateExercise<K extends keyof WorkoutExercise>(
    ei: number, key: K, value: WorkoutExercise[K]
  ) {
    setExercises((prev) => prev.map((ex, i) => i === ei ? { ...ex, [key]: value } : ex));
  }

  function updateSet(ei: number, si: number, key: keyof WorkoutSet, value: number) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === ei
          ? { ...ex, sets: ex.sets.map((s, j) => j === si ? { ...s, [key]: value } : s) }
          : ex
      )
    );
  }

  function addSet(ei: number) {
    setExercises((prev) =>
      prev.map((ex, i) => i === ei ? { ...ex, sets: [...ex.sets, emptySet()] } : ex)
    );
  }

  function removeSet(ei: number, si: number) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === ei ? { ...ex, sets: ex.sets.filter((_, j) => j !== si) } : ex
      )
    );
  }

  function addExercise() {
    setExercises((prev) => [...prev, emptyExercise()]);
  }

  function removeExercise(ei: number) {
    setExercises((prev) => prev.filter((_, i) => i !== ei));
  }

  // ── validation ──────────────────────────────────────────────

  const hasNoExercises = exercises.length === 0;
  const hasEmptySets = exercises.some((ex) => ex.sets.length === 0);
  const canSave = !hasNoExercises && !hasEmptySets;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setSaveError("");
    try {
      await saveWorkout(uid, workoutName.trim() || "Workout", exercises);
      resetForm();
    } catch {
      setSaveError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setSaving(false);
    }
  }

  // ── render ──────────────────────────────────────────────────

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workouts</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? "Abbrechen" : "+ Neues Workout"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
          <input
            type="text"
            placeholder="Workout-Name (z.B. Push Day)"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
          />

          {exercises.map((ex, ei) => (
            <div key={ei} className="bg-gray-800 rounded-lg p-3 space-y-3">
              {/* Exercise header */}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Übungsname"
                  value={ex.name}
                  onChange={(e) => updateExercise(ei, "name", e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
                <select
                  value={ex.unit}
                  onChange={(e) => updateExercise(ei, "unit", e.target.value as Unit)}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
                {exercises.length > 1 && (
                  <button
                    onClick={() => removeExercise(ei)}
                    className="text-gray-500 hover:text-red-400 text-lg leading-none transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Sets */}
              <div className="space-y-1.5">
                <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-xs text-gray-500 px-1">
                  <span>#</span><span>Wdh</span><span>Gewicht</span><span />
                </div>
                {ex.sets.map((s, si) => (
                  <div key={si} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                    <span className="text-gray-600 text-xs w-5 text-center">{si + 1}</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={s.reps || ""}
                      onChange={(e) => updateSet(ei, si, "reps", Number(e.target.value))}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="0"
                      value={s.weight || ""}
                      onChange={(e) => updateSet(ei, si, "weight", Number(e.target.value))}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => removeSet(ei, si)}
                      disabled={ex.sets.length === 1}
                      className="text-gray-600 hover:text-red-400 disabled:opacity-30 text-lg leading-none transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addSet(ei)}
                  className="text-emerald-500 hover:text-emerald-400 text-xs transition-colors mt-1"
                >
                  + Satz
                </button>
              </div>

              {/* Notes */}
              <input
                type="text"
                placeholder="Notiz (optional)"
                value={ex.notes}
                onChange={(e) => updateExercise(ei, "notes", e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          ))}

          <button
            onClick={addExercise}
            className="w-full border border-dashed border-gray-700 hover:border-emerald-600 text-gray-500 hover:text-emerald-400 text-sm py-2 rounded-lg transition-colors"
          >
            + Übung hinzufügen
          </button>

          {(hasNoExercises || hasEmptySets) && (
            <p className="text-amber-400 text-xs">
              {hasNoExercises
                ? "Mindestens eine Übung erforderlich."
                : "Mindestens ein Satz pro Übung erforderlich."}
            </p>
          )}
          {saveError && <p className="text-red-400 text-xs">{saveError}</p>}

          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {saving ? "Wird gespeichert…" : "Workout speichern"}
          </button>
        </div>
      )}

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Verlauf</h2>
        {workouts.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">
            Noch keine Workouts. Leg los! 💪
          </p>
        ) : (
          workouts.map((w) => <WorkoutCard key={w.id} workout={w} />)
        )}
      </div>
    </div>
  );
}
