import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { saveMeal, subscribeToMeals, saveGoal, subscribeToGoal } from "@/lib/nutrition";
import type { MealEntry, NutritionGoal } from "@/types/nutrition";

// ── helpers ───────────────────────────────────────────────────────────────────

function toDateKey(d: Date): string {
  return d.toLocaleDateString("sv-SE"); // "2026-05-17"
}

function formatDay(d: Date): string {
  const today = toDateKey(new Date()) === toDateKey(d);
  const label = d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit" });
  return today ? `Heute, ${d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}` : label;
}

// ── MacroTile ────────────────────────────────────────────────────────────────

function MacroTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
      <p className={`text-lg font-bold ${color}`}>{value.toFixed(0)}<span className="text-xs font-normal text-gray-500 ml-0.5">g</span></p>
      <p className="text-gray-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}

// ── MealRow ──────────────────────────────────────────────────────────────────

function MealRow({ meal }: { meal: MealEntry }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
      <div>
        <p className="text-sm text-white">{meal.name}</p>
        {(meal.protein > 0 || meal.carbs > 0 || meal.fat > 0) && (
          <p className="text-xs text-gray-500 mt-0.5">
            P {meal.protein}g · KH {meal.carbs}g · F {meal.fat}g
          </p>
        )}
      </div>
      <span className="text-sm font-semibold text-emerald-400 ml-3 shrink-0">{meal.calories} kcal</span>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Nutrition() {
  const { user } = useAuth();
  const uid = user!.uid;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [goal, setGoal] = useState<NutritionGoal | null>(null);

  // goal editing
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  // meal form
  const [showForm, setShowForm] = useState(false);
  const [mealName, setMealName] = useState("");
  const [mealCal, setMealCal] = useState("");
  const [mealProtein, setMealProtein] = useState("");
  const [mealCarbs, setMealCarbs] = useState("");
  const [mealFat, setMealFat] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const dateKey = toDateKey(selectedDate);
  const isToday = dateKey === toDateKey(new Date());

  // ── subscriptions ────────────────────────────────────────────
  useEffect(() => subscribeToGoal(uid, setGoal), [uid]);
  useEffect(() => subscribeToMeals(uid, dateKey, setMeals), [uid, dateKey]);

  // ── day navigation ───────────────────────────────────────────
  function prevDay() {
    setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  }
  function nextDay() {
    if (!isToday) setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  }

  // ── totals ───────────────────────────────────────────────────
  const totalCal = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.protein, 0);
  const totalCarbs = meals.reduce((s, m) => s + m.carbs, 0);
  const totalFat = meals.reduce((s, m) => s + m.fat, 0);

  const ratio = goal ? totalCal / goal.calorieGoal : 0;
  const barColor = ratio > 1.15 ? "bg-red-500" : ratio > 1 ? "bg-amber-400" : "bg-emerald-500";

  // ── goal save ────────────────────────────────────────────────
  async function handleSaveGoal() {
    const val = parseInt(goalInput);
    if (!val || val <= 0) return;
    setSavingGoal(true);
    try { await saveGoal(uid, val); setEditingGoal(false); }
    finally { setSavingGoal(false); }
  }

  // ── meal save ────────────────────────────────────────────────
  async function handleSaveMeal(e: React.FormEvent) {
    e.preventDefault();
    const cal = parseInt(mealCal);
    if (!cal || cal <= 0) return;
    setSaving(true); setSaveError("");
    try {
      await saveMeal(uid, dateKey, {
        name: mealName.trim(),
        calories: cal,
        protein: parseFloat(mealProtein) || 0,
        carbs: parseFloat(mealCarbs) || 0,
        fat: parseFloat(mealFat) || 0,
      });
      setMealName(""); setMealCal(""); setMealProtein(""); setMealCarbs(""); setMealFat("");
      setShowForm(false);
    } catch {
      setSaveError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setSaving(false);
    }
  }

  // ── render ───────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-6">

      {/* Day navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevDay} className="text-gray-400 hover:text-white p-1 transition-colors text-xl">◀</button>
        <h2 className="text-sm font-semibold text-white">{formatDay(selectedDate)}</h2>
        <button
          onClick={nextDay}
          disabled={isToday}
          className="text-gray-400 hover:text-white disabled:opacity-20 p-1 transition-colors text-xl"
        >▶</button>
      </div>

      {/* Calorie goal section */}
      {!goal && !editingGoal ? (
        <button
          onClick={() => { setEditingGoal(true); setGoalInput(""); }}
          className="w-full border border-dashed border-gray-700 hover:border-emerald-600 text-gray-500 hover:text-emerald-400 text-sm py-3 rounded-xl transition-colors"
        >
          + Kalorienziel setzen
        </button>
      ) : editingGoal ? (
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            placeholder="z.B. 2500"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            autoFocus
            className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
          />
          <span className="text-gray-500 text-sm self-center">kcal</span>
          <button
            onClick={handleSaveGoal}
            disabled={savingGoal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >✓</button>
          <button
            onClick={() => setEditingGoal(false)}
            className="text-gray-500 hover:text-gray-300 text-sm px-3 py-2 transition-colors"
          >✕</button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{totalCal} kcal</span>
            <button
              onClick={() => { setEditingGoal(true); setGoalInput(String(goal!.calorieGoal)); }}
              className="text-gray-600 hover:text-gray-400 transition-colors text-xs"
            >
              Ziel: {goal!.calorieGoal} kcal ✏️
            </button>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${Math.min(ratio * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 text-right">
            {Math.max(0, goal!.calorieGoal - totalCal)} kcal verbleibend
          </p>
        </div>
      )}

      {/* Macro tiles */}
      <div className="flex gap-2">
        <MacroTile label="Protein" value={totalProtein} color="text-blue-400" />
        <MacroTile label="Kohlenhydrate" value={totalCarbs} color="text-yellow-400" />
        <MacroTile label="Fett" value={totalFat} color="text-orange-400" />
      </div>

      {/* Add meal button */}
      <button
        onClick={() => setShowForm((v) => !v)}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
      >
        {showForm ? "Abbrechen" : "+ Mahlzeit hinzufügen"}
      </button>

      {/* Meal form */}
      {showForm && (
        <form onSubmit={handleSaveMeal} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Mahlzeit (z.B. Haferflocken)"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="number"
                min={1}
                placeholder="Kalorien"
                value={mealCal}
                onChange={(e) => setMealCal(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <span className="text-gray-500 text-sm self-center shrink-0">kcal</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Protein (g)", val: mealProtein, set: setMealProtein },
              { label: "KH (g)", val: mealCarbs, set: setMealCarbs },
              { label: "Fett (g)", val: mealFat, set: setMealFat },
            ].map(({ label, val, set }) => (
              <input
                key={label}
                type="number"
                min={0}
                step={0.1}
                placeholder={label}
                value={val}
                onChange={(e) => set(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-xs text-center"
              />
            ))}
          </div>
          {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {saving ? "Wird gespeichert…" : "Speichern"}
          </button>
        </form>
      )}

      {/* Meal list */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl px-4">
        {meals.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-6">Noch keine Mahlzeiten {isToday ? "heute" : "an diesem Tag"}.</p>
        ) : (
          meals.map((m) => <MealRow key={m.id} meal={m} />)
        )}
      </div>
    </div>
  );
}
