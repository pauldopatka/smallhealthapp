import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToGoal, subscribeToMeals } from "@/lib/nutrition";
import { subscribeToWeightEntries } from "@/lib/weight";
import RingChart from "@/components/RingChart";
import TrainingCycleWidget from "@/components/TrainingCycleWidget";
import type { MealEntry, NutritionGoal } from "@/types/nutrition";
import type { WeightEntry } from "@/types/weight";

// ── helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Guten Morgen";
  if (h < 17) return "Guten Tag";
  return "Guten Abend";
}

function calColor(ratio: number): string {
  if (ratio > 1.15) return "#f87171";
  if (ratio > 1) return "#fbbf24";
  return "#34d399";
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const uid = user!.uid;

  const todayKey = useMemo(() => new Date().toLocaleDateString("sv-SE"), []);

  const [goal, setGoal] = useState<NutritionGoal | null | undefined>(undefined);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);

  useEffect(() => subscribeToGoal(uid, (g) => setGoal(g ?? null)), [uid]);
  useEffect(() => subscribeToMeals(uid, todayKey, setMeals), [uid, todayKey]);
  useEffect(() => subscribeToWeightEntries(uid, setWeights), [uid]);

  // ── nutrition totals ─────────────────────────────────────────
  const totalCal = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.protein, 0);
  const totalCarbs = meals.reduce((s, m) => s + m.carbs, 0);
  const totalFat = meals.reduce((s, m) => s + m.fat, 0);

  const calorieGoal = goal?.calorieGoal ?? 0;
  const proteinGoal = Math.round(calorieGoal * 0.30 / 4);
  const carbsGoal = Math.round(calorieGoal * 0.45 / 4);
  const fatGoal = Math.round(calorieGoal * 0.25 / 9);
  const ratio = calorieGoal > 0 ? totalCal / calorieGoal : 0;

  // ── weight ───────────────────────────────────────────────────
  const currentEntry = weights.length > 0 ? weights[weights.length - 1] : null;
  const sevenDaysAgo = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d;
  }, []);
  const weekEntry = weights.find(
    (e) => e.date?.toDate && e.date.toDate() >= sevenDaysAgo
  );
  const delta =
    currentEntry && weekEntry && weekEntry.id !== currentEntry.id
      ? currentEntry.weight - weekEntry.weight
      : null;

  // ── render ───────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">FitTrack 💪</h1>
        <p className="text-gray-500 text-sm">{getGreeting()}</p>
      </div>

      {/* Training cycle widget */}
      <TrainingCycleWidget />

      {/* Top row: calorie ring + weight */}
      <div className="grid grid-cols-2 gap-3">

        {/* Calorie ring */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center space-y-2">
          {goal === undefined ? (
            <div className="w-6 h-6 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
          ) : !goal ? (
            <div className="text-center space-y-2">
              <p className="text-gray-600 text-xs">Kein Kalorienziel</p>
              <Link to="/nutrition" className="text-emerald-400 text-xs hover:underline">
                Ziel setzen →
              </Link>
            </div>
          ) : (
            <>
              <RingChart
                value={totalCal}
                max={calorieGoal}
                color={calColor(ratio)}
                size={96}
                label={String(totalCal)}
                sublabel={`/ ${calorieGoal}`}
              />
              <p className="text-gray-500 text-xs">kcal heute</p>
            </>
          )}
        </div>

        {/* Weight card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col justify-center space-y-1.5">
          {currentEntry ? (
            <>
              <p className="text-gray-500 text-xs uppercase tracking-wide">Gewicht</p>
              <p className="text-2xl font-bold text-white leading-none">
                {currentEntry.weight}
                <span className="text-sm font-normal text-gray-500 ml-1">{currentEntry.unit}</span>
              </p>
              {delta !== null && (
                <p className={`text-sm font-medium ${
                  Math.abs(delta) <= 0.2
                    ? "text-gray-500"
                    : delta < 0 ? "text-emerald-400" : "text-red-400"
                }`}>
                  {delta > 0 ? "↑" : delta < 0 ? "↓" : "→"}{" "}
                  {Math.abs(delta).toFixed(1)} {currentEntry.unit}
                  <span className="text-gray-600 text-xs font-normal ml-1">7 Tage</span>
                </p>
              )}
            </>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 text-xs mb-2">Kein Gewicht</p>
              <Link to="/weight" className="text-emerald-400 text-xs hover:underline">
                Eintragen →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Macro rings */}
      {goal && calorieGoal > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-4">Makros heute</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Protein", value: totalProtein, max: proteinGoal, color: "#60a5fa", textColor: "text-blue-400" },
              { label: "Kohlenhydrate", value: totalCarbs, max: carbsGoal, color: "#facc15", textColor: "text-yellow-400" },
              { label: "Fett", value: totalFat, max: fatGoal, color: "#fb923c", textColor: "text-orange-400" },
            ].map(({ label, value, max, color, textColor }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <RingChart
                  value={value}
                  max={max}
                  color={color}
                  size={68}
                  label={`${Math.round(value)}g`}
                  sublabel={`/ ${max}g`}
                />
                <p className={`text-xs ${textColor}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
