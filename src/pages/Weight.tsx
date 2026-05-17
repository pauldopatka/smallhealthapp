import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { saveWeight, subscribeToWeightEntries } from "@/lib/weight";
import type { WeightEntry } from "@/types/weight";
import type { Unit } from "@/types/workout";

// ── types ─────────────────────────────────────────────────────────────────────

type Period = "1W" | "1M" | "3M" | "1J";

const PERIOD_DAYS: Record<Period, number> = { "1W": 7, "1M": 30, "3M": 90, "1J": 365 };

interface ChartPoint { dateLabel: string; weight: number; }

// ── helpers ───────────────────────────────────────────────────────────────────

function cutoffDate(period: Period): Date {
  const d = new Date();
  d.setDate(d.getDate() - PERIOD_DAYS[period]);
  return d;
}

function formatLabel(date: Date, period: Period): string {
  if (period === "1W") return date.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit" });
  if (period === "1M") return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  return date.toLocaleDateString("de-DE", { month: "short", year: "2-digit" });
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Weight() {
  const { user } = useAuth();
  const uid = user!.uid;

  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [period, setPeriod] = useState<Period>("1M");
  const [weightInput, setWeightInput] = useState("");
  const [unit, setUnit] = useState<Unit>("kg");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => subscribeToWeightEntries(uid, setEntries), [uid]);

  // pick unit from most recent entry
  useEffect(() => {
    if (entries.length > 0) setUnit(entries[entries.length - 1].unit);
  }, [entries]);

  // ── filter & chart data ──────────────────────────────────────────
  const cutoff = cutoffDate(period);
  const filtered = entries.filter((e) => e.date?.toDate && e.date.toDate() >= cutoff);

  const chartData: ChartPoint[] = filtered.map((e) => ({
    dateLabel: formatLabel(e.date.toDate(), period),
    weight: e.weight,
  }));

  // ── trend ────────────────────────────────────────────────────────
  const hasTrend = filtered.length >= 2;
  const delta = hasTrend
    ? filtered[filtered.length - 1].weight - filtered[0].weight
    : 0;
  const arrow = Math.abs(delta) <= 0.2 ? "→" : delta < 0 ? "↓" : "↑";
  const trendColor =
    Math.abs(delta) <= 0.2 ? "text-gray-400" : delta < 0 ? "text-emerald-400" : "text-red-400";
  const periodLabel: Record<Period, string> = {
    "1W": "1 Woche", "1M": "1 Monat", "3M": "3 Monaten", "1J": "1 Jahr",
  };

  // ── save ─────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(weightInput);
    if (!val || val <= 0) return;
    setSaving(true); setSaveError("");
    try {
      await saveWeight(uid, val, unit);
      setWeightInput("");
    } catch {
      setSaveError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setSaving(false);
    }
  }

  // ── render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-6">
      <h1 className="text-2xl font-bold">Gewicht</h1>

      {/* Entry form */}
      <form onSubmit={handleSave} className="flex gap-2">
        <input
          type="number"
          step={0.1}
          min={0}
          placeholder="z.B. 82.5"
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          required
          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
        />
        <button
          type="button"
          onClick={() => setUnit((u) => u === "kg" ? "lbs" : "kg")}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm px-3 py-2.5 rounded-lg transition-colors w-14"
        >
          {unit}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          {saving ? "…" : "Speichern"}
        </button>
      </form>
      {saveError && <p className="text-red-400 text-xs -mt-2">{saveError}</p>}

      {entries.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-12">
          Noch kein Gewicht eingetragen.
        </p>
      ) : (
        <>
          {/* Period tabs */}
          <div className="flex gap-1 bg-gray-900 p-1 rounded-xl">
            {(["1W", "1M", "3M", "1J"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-gray-700 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Trend indicator */}
          {hasTrend && (
            <div className={`flex items-baseline gap-1.5 ${trendColor}`}>
              <span className="text-2xl font-bold">{arrow}</span>
              <span className="text-lg font-semibold">
                {delta > 0 ? "+" : ""}{delta.toFixed(1)} {filtered[filtered.length - 1].unit}
              </span>
              <span className="text-gray-500 text-sm">seit {periodLabel[period]}</span>
            </div>
          )}

          {/* Chart or empty period state */}
          {chartData.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">
              Keine Daten für diesen Zeitraum.
            </p>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      border: "1px solid #374151",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                    labelStyle={{ color: "#9ca3af" }}
                    itemStyle={{ color: "#34d399" }}
                    formatter={(v) => [`${v} ${unit}`, "Gewicht"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={chartData.length <= 14}
                    activeDot={{ r: 4, fill: "#34d399" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Latest value */}
          {entries.length > 0 && (
            <p className="text-center text-gray-500 text-xs">
              Aktuell:{" "}
              <span className="text-white font-semibold text-sm">
                {entries[entries.length - 1].weight} {entries[entries.length - 1].unit}
              </span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
