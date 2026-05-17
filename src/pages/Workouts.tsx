import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { saveWorkout, subscribeToWorkouts } from "@/lib/workouts";
import { saveTemplate, subscribeToTemplates } from "@/lib/workoutTemplates";
import type {
  Workout, WorkoutExercise, WorkoutSet, Unit,
  WorkoutTemplate, TemplateExercise, TemplateSet,
} from "@/types/workout";

// ── helpers ──────────────────────────────────────────────────────────────────

function emptySet(): WorkoutSet { return { reps: 0, weight: 0 }; }
function emptyExercise(): WorkoutExercise { return { name: "", unit: "kg", notes: "", sets: [emptySet()] }; }
function emptyTmplSet(): TemplateSet { return {}; }
function emptyTmplExercise(): TemplateExercise { return { name: "", unit: "kg", sets: [emptyTmplSet()] }; }

function formatDate(ts: { toDate?: () => Date } | null | undefined): string {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── WorkoutCard ───────────────────────────────────────────────────────────────

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

// ── TemplateCard ──────────────────────────────────────────────────────────────

function TemplateCard({ template }: { template: WorkoutTemplate }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-1">
      <h3 className="font-semibold text-white text-sm">{template.name}</h3>
      <p className="text-gray-500 text-xs">
        {template.exercises.map((ex) => `${ex.name} (${ex.sets.length}×)`).join(" · ")}
      </p>
    </div>
  );
}

// ── ExerciseForm (shared shape for workout + template rows) ───────────────────

interface SetRowProps {
  index: number;
  reps: number | undefined;
  weight?: number;
  onRepsChange: (v: number | undefined) => void;
  onWeightChange?: (v: number) => void;
  onRemove: () => void;
  canRemove: boolean;
  showWeight: boolean;
}

function SetRow({ index, reps, weight, onRepsChange, onWeightChange, onRemove, canRemove, showWeight }: SetRowProps) {
  const cols = showWeight ? "grid-cols-[auto_1fr_1fr_auto]" : "grid-cols-[auto_1fr_auto]";
  return (
    <div className={`grid ${cols} gap-2 items-center`}>
      <span className="text-gray-600 text-xs w-5 text-center">{index + 1}</span>
      <input
        type="number"
        min={0}
        placeholder={showWeight ? "Wdh" : "Ziel-Wdh (opt.)"}
        value={reps ?? ""}
        onChange={(e) => onRepsChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-emerald-500"
      />
      {showWeight && (
        <input
          type="number"
          min={0}
          step={0.5}
          placeholder="Gewicht"
          value={weight || ""}
          onChange={(e) => onWeightChange?.(Number(e.target.value))}
          className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-emerald-500"
        />
      )}
      <button
        onClick={onRemove}
        disabled={!canRemove}
        className="text-gray-600 hover:text-red-400 disabled:opacity-30 text-lg leading-none transition-colors"
      >×</button>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Workouts() {
  const { user } = useAuth();
  const uid = user!.uid;
  const pickerRef = useRef<HTMLDivElement>(null);

  // ── workout state ────────────────────────────────────────────
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([emptyExercise()]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ── template state ───────────────────────────────────────────
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showTmplForm, setShowTmplForm] = useState(false);
  const [tmplName, setTmplName] = useState("");
  const [tmplExercises, setTmplExercises] = useState<TemplateExercise[]>([emptyTmplExercise()]);
  const [tmplSaving, setTmplSaving] = useState(false);
  const [tmplSaveError, setTmplSaveError] = useState("");

  // ── subscriptions ────────────────────────────────────────────
  useEffect(() => {
    const unsub1 = subscribeToWorkouts(uid, setWorkouts);
    const unsub2 = subscribeToTemplates(uid, setTemplates);
    return () => { unsub1(); unsub2(); };
  }, [uid]);

  // close picker on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── workout form helpers ─────────────────────────────────────
  function resetForm() { setWorkoutName(""); setExercises([emptyExercise()]); setSaveError(""); setShowForm(false); }

  function updateExercise<K extends keyof WorkoutExercise>(ei: number, key: K, val: WorkoutExercise[K]) {
    setExercises((p) => p.map((ex, i) => i === ei ? { ...ex, [key]: val } : ex));
  }
  function updateSet(ei: number, si: number, key: keyof WorkoutSet, val: number) {
    setExercises((p) => p.map((ex, i) => i === ei
      ? { ...ex, sets: ex.sets.map((s, j) => j === si ? { ...s, [key]: val } : s) }
      : ex));
  }
  const addSet = (ei: number) => setExercises((p) => p.map((ex, i) => i === ei ? { ...ex, sets: [...ex.sets, emptySet()] } : ex));
  const removeSet = (ei: number, si: number) => setExercises((p) => p.map((ex, i) => i === ei ? { ...ex, sets: ex.sets.filter((_, j) => j !== si) } : ex));
  const addExercise = () => setExercises((p) => [...p, emptyExercise()]);
  const removeExercise = (ei: number) => setExercises((p) => p.filter((_, i) => i !== ei));

  const hasNoExercises = exercises.length === 0;
  const hasEmptySets = exercises.some((ex) => ex.sets.length === 0);
  const canSave = !hasNoExercises && !hasEmptySets;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true); setSaveError("");
    try { await saveWorkout(uid, workoutName.trim() || "Workout", exercises); resetForm(); }
    catch { setSaveError("Speichern fehlgeschlagen. Bitte versuche es erneut."); }
    finally { setSaving(false); }
  }

  // ── apply template ───────────────────────────────────────────
  function applyTemplate(t: WorkoutTemplate) {
    setWorkoutName(t.name);
    setExercises(t.exercises.map((ex) => ({
      name: ex.name,
      unit: ex.unit,
      notes: "",
      sets: ex.sets.map((s) => ({ reps: s.targetReps ?? 0, weight: 0 })),
    })));
    setShowForm(true);
    setShowPicker(false);
  }

  // ── template form helpers ────────────────────────────────────
  function resetTmplForm() { setTmplName(""); setTmplExercises([emptyTmplExercise()]); setTmplSaveError(""); setShowTmplForm(false); }

  function updateTmplExercise<K extends keyof TemplateExercise>(ei: number, key: K, val: TemplateExercise[K]) {
    setTmplExercises((p) => p.map((ex, i) => i === ei ? { ...ex, [key]: val } : ex));
  }
  function updateTmplSet(ei: number, si: number, val: number | undefined) {
    setTmplExercises((p) => p.map((ex, i) => i === ei
      ? { ...ex, sets: ex.sets.map((s, j) => j === si ? { targetReps: val } : s) }
      : ex));
  }
  const addTmplSet = (ei: number) => setTmplExercises((p) => p.map((ex, i) => i === ei ? { ...ex, sets: [...ex.sets, emptyTmplSet()] } : ex));
  const removeTmplSet = (ei: number, si: number) => setTmplExercises((p) => p.map((ex, i) => i === ei ? { ...ex, sets: ex.sets.filter((_, j) => j !== si) } : ex));
  const addTmplExercise = () => setTmplExercises((p) => [...p, emptyTmplExercise()]);
  const removeTmplExercise = (ei: number) => setTmplExercises((p) => p.filter((_, i) => i !== ei));

  const tmplHasNoExercises = tmplExercises.length === 0;
  const tmplHasEmptySets = tmplExercises.some((ex) => ex.sets.length === 0);
  const canSaveTmpl = !tmplHasNoExercises && !tmplHasEmptySets;

  async function handleSaveTmpl() {
    if (!canSaveTmpl) return;
    setTmplSaving(true); setTmplSaveError("");
    try { await saveTemplate(uid, tmplName.trim() || "Template", tmplExercises); resetTmplForm(); }
    catch { setTmplSaveError("Speichern fehlgeschlagen. Bitte versuche es erneut."); }
    finally { setTmplSaving(false); }
  }

  // ── render ───────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-6">

      {/* ── Header buttons ── */}
      <div className="flex items-center gap-2">
        {/* Template picker */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>Aus Template starten</span>
            <span className="text-xs opacity-60">{showPicker ? "▲" : "▼"}</span>
          </button>

          {showPicker && (
            <div className="absolute left-0 top-full mt-1 z-10 bg-gray-900 border border-gray-700 rounded-xl shadow-xl min-w-48 py-1">
              {templates.length === 0 ? (
                <p className="text-gray-500 text-xs px-4 py-3 text-center leading-relaxed">
                  Noch keine Templates.<br />Erstelle unten dein erstes Template.
                </p>
              ) : (
                templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
                  >
                    <span className="font-medium">{t.name}</span>
                    <span className="block text-gray-500 text-xs mt-0.5">
                      {t.exercises.length} Übung{t.exercises.length !== 1 ? "en" : ""}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => { setShowForm((v) => !v); setShowPicker(false); }}
          className="ml-auto bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? "Abbrechen" : "+ Neues Workout"}
        </button>
      </div>

      {/* ── Workout form ── */}
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
                  <button onClick={() => removeExercise(ei)} className="text-gray-500 hover:text-red-400 text-lg leading-none transition-colors">×</button>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-xs text-gray-500 px-1">
                  <span>#</span><span>Wdh</span><span>Gewicht</span><span />
                </div>
                {ex.sets.map((s, si) => (
                  <SetRow
                    key={si}
                    index={si}
                    reps={s.reps}
                    weight={s.weight}
                    onRepsChange={(v) => updateSet(ei, si, "reps", v ?? 0)}
                    onWeightChange={(v) => updateSet(ei, si, "weight", v)}
                    onRemove={() => removeSet(ei, si)}
                    canRemove={ex.sets.length > 1}
                    showWeight={true}
                  />
                ))}
                <button onClick={() => addSet(ei)} className="text-emerald-500 hover:text-emerald-400 text-xs transition-colors mt-1">+ Satz</button>
              </div>
              <input
                type="text"
                placeholder="Notiz (optional)"
                value={ex.notes}
                onChange={(e) => updateExercise(ei, "notes", e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          ))}

          <button onClick={addExercise} className="w-full border border-dashed border-gray-700 hover:border-emerald-600 text-gray-500 hover:text-emerald-400 text-sm py-2 rounded-lg transition-colors">
            + Übung hinzufügen
          </button>

          {(hasNoExercises || hasEmptySets) && (
            <p className="text-amber-400 text-xs">
              {hasNoExercises ? "Mindestens eine Übung erforderlich." : "Mindestens ein Satz pro Übung erforderlich."}
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

      {/* ── History ── */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Verlauf</h2>
        {workouts.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">Noch keine Workouts. Leg los! 💪</p>
        ) : (
          workouts.map((w) => <WorkoutCard key={w.id} workout={w} />)
        )}
      </div>

      {/* ── Templates section ── */}
      <div className="space-y-3 pt-2 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Templates</h2>
          <button
            onClick={() => setShowTmplForm((v) => !v)}
            className="text-emerald-500 hover:text-emerald-400 text-sm transition-colors"
          >
            {showTmplForm ? "Abbrechen" : "+ Template erstellen"}
          </button>
        </div>

        {templates.length === 0 && !showTmplForm && (
          <p className="text-gray-600 text-sm text-center py-4">Noch keine Templates.</p>
        )}

        {templates.map((t) => <TemplateCard key={t.id} template={t} />)}

        {/* ── Template creation form ── */}
        {showTmplForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
            <input
              type="text"
              placeholder="Template-Name (z.B. Push Day)"
              value={tmplName}
              onChange={(e) => setTmplName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
            />

            {tmplExercises.map((ex, ei) => (
              <div key={ei} className="bg-gray-800 rounded-lg p-3 space-y-3">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Übungsname"
                    value={ex.name}
                    onChange={(e) => updateTmplExercise(ei, "name", e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                  <select
                    value={ex.unit}
                    onChange={(e) => updateTmplExercise(ei, "unit", e.target.value as Unit)}
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
                  >
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </select>
                  {tmplExercises.length > 1 && (
                    <button onClick={() => removeTmplExercise(ei)} className="text-gray-500 hover:text-red-400 text-lg leading-none transition-colors">×</button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-[auto_1fr_auto] gap-2 text-xs text-gray-500 px-1">
                    <span>#</span><span>Ziel-Wdh (optional)</span><span />
                  </div>
                  {ex.sets.map((s, si) => (
                    <SetRow
                      key={si}
                      index={si}
                      reps={s.targetReps}
                      onRepsChange={(v) => updateTmplSet(ei, si, v)}
                      onRemove={() => removeTmplSet(ei, si)}
                      canRemove={ex.sets.length > 1}
                      showWeight={false}
                    />
                  ))}
                  <button onClick={() => addTmplSet(ei)} className="text-emerald-500 hover:text-emerald-400 text-xs transition-colors mt-1">+ Satz</button>
                </div>
              </div>
            ))}

            <button onClick={addTmplExercise} className="w-full border border-dashed border-gray-700 hover:border-emerald-600 text-gray-500 hover:text-emerald-400 text-sm py-2 rounded-lg transition-colors">
              + Übung hinzufügen
            </button>

            {(tmplHasNoExercises || tmplHasEmptySets) && (
              <p className="text-amber-400 text-xs">
                {tmplHasNoExercises ? "Mindestens eine Übung erforderlich." : "Mindestens ein Satz pro Übung erforderlich."}
              </p>
            )}
            {tmplSaveError && <p className="text-red-400 text-xs">{tmplSaveError}</p>}

            <button
              onClick={handleSaveTmpl}
              disabled={tmplSaving || !canSaveTmpl}
              className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {tmplSaving ? "Wird gespeichert…" : "Template speichern"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
