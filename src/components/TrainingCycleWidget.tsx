import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToCycle, saveCycleConfig, checkOffWorkout } from "@/lib/trainingCycle";
import { subscribeToTemplates } from "@/lib/workoutTemplates";
import type { CycleConfig, CycleEntry } from "@/types/trainingCycle";
import type { WorkoutTemplate } from "@/types/workout";

const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function todayKey(): string {
  return new Date().toLocaleDateString("sv-SE");
}

function getNextWorkout(config: CycleConfig): { entry: CycleEntry; dayLabel?: string } | null {
  if (config.entries.length === 0) return null;

  if (config.mode === "queue") {
    return { entry: config.entries[config.currentIndex % config.entries.length] };
  }

  const today = new Date().getDay();
  const withDist = config.entries
    .filter((e) => e.dayOfWeek !== undefined)
    .map((e) => ({ ...e, dist: (e.dayOfWeek! - today + 7) % 7 }))
    .sort((a, b) => a.dist - b.dist);

  if (withDist.length === 0) return null;

  const checked = config.lastCompletedDate === todayKey();
  const next = checked ? withDist.find((e) => e.dist > 0) ?? withDist[0] : withDist[0];
  const dayLabel = next.dist === 0 ? "Heute" : DAY_NAMES[next.dayOfWeek!];
  return { entry: next, dayLabel };
}

export default function TrainingCycleWidget() {
  const { user } = useAuth();
  const uid = user!.uid;

  const [cycle, setCycle] = useState<CycleConfig | null | undefined>(undefined);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [showConfig, setShowConfig] = useState(false);

  const [cfgMode, setCfgMode] = useState<"queue" | "weekday">("queue");
  const [cfgEntries, setCfgEntries] = useState<CycleEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => subscribeToCycle(uid, setCycle), [uid]);
  useEffect(() => subscribeToTemplates(uid, setTemplates), [uid]);

  useEffect(() => {
    if (cycle) {
      setCfgMode(cycle.mode);
      setCfgEntries([...cycle.entries]);
    }
  }, [cycle]);

  const checkedToday = cycle?.lastCompletedDate === todayKey();
  const next = cycle ? getNextWorkout(cycle) : null;

  async function handleCheckOff() {
    if (!cycle || checkedToday) return;
    await checkOffWorkout(uid, cycle);
  }

  function addEntry(t: WorkoutTemplate) {
    setCfgEntries((p) => [...p, { templateId: t.id, templateName: t.name }]);
  }

  function removeEntry(idx: number) {
    setCfgEntries((p) => p.filter((_, i) => i !== idx));
  }

  function setEntryDay(idx: number, day: number) {
    setCfgEntries((p) => p.map((e, i) => (i === idx ? { ...e, dayOfWeek: day } : e)));
  }

  async function handleSaveConfig() {
    if (cfgEntries.length === 0) return;
    setSaving(true);
    setSaveError("");
    try {
      await saveCycleConfig(uid, {
        mode: cfgMode,
        entries: cfgEntries,
        currentIndex: cycle?.currentIndex ?? 0,
        lastCompletedDate: cycle?.lastCompletedDate ?? "",
      });
      setShowConfig(false);
    } catch {
      setSaveError("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  if (cycle === undefined) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <p className="text-gray-500 text-xs uppercase tracking-wide">Nächstes Training</p>

      {/* Widget display */}
      {!cycle || cycle.entries.length === 0 ? (
        <div className="text-center space-y-2 py-1">
          <p className="text-gray-600 text-sm">Kein Trainingsplan.</p>
          <button
            onClick={() => setShowConfig(true)}
            className="text-emerald-400 text-sm hover:underline"
          >
            Zyklus erstellen →
          </button>
        </div>
      ) : next ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              {next.dayLabel && (
                <p className="text-gray-500 text-xs">{next.dayLabel}</p>
              )}
              <p className="text-white font-semibold text-lg">{next.entry.templateName}</p>
            </div>
            {checkedToday ? (
              <span className="text-emerald-400 text-sm font-medium px-3 py-1.5 bg-emerald-400/10 rounded-lg">
                ✓ Erledigt
              </span>
            ) : (
              <button
                onClick={handleCheckOff}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                Abhaken ✓
              </button>
            )}
          </div>
          <Link
            to="/workouts"
            className="text-gray-500 hover:text-gray-300 text-xs transition-colors inline-block"
          >
            → Zum Training
          </Link>
        </div>
      ) : null}

      {/* Config toggle */}
      <button
        onClick={() => setShowConfig((v) => !v)}
        className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
      >
        {showConfig ? "Schließen" : "Zyklus bearbeiten"}
      </button>

      {/* Config form */}
      {showConfig && (
        <div className="border-t border-gray-800 pt-3 space-y-3">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-gray-800 p-1 rounded-lg">
            {(["queue", "weekday"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setCfgMode(m)}
                className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                  cfgMode === m ? "bg-gray-600 text-white" : "text-gray-500"
                }`}
              >
                {m === "queue" ? "Warteschlange" : "Wochentage"}
              </button>
            ))}
          </div>

          {/* Entries list */}
          {cfgEntries.length === 0 && (
            <p className="text-gray-600 text-xs text-center py-2">Noch keine Einträge.</p>
          )}
          {cfgEntries.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              {cfgMode === "weekday" && (
                <select
                  value={entry.dayOfWeek ?? 1}
                  onChange={(e) => setEntryDay(idx, Number(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
                >
                  {DAY_NAMES.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              )}
              <span className="flex-1 text-gray-300 truncate">{entry.templateName}</span>
              <button
                onClick={() => removeEntry(idx)}
                className="text-gray-600 hover:text-red-400 text-lg leading-none transition-colors"
              >
                ×
              </button>
            </div>
          ))}

          {/* Add template */}
          {templates.length === 0 ? (
            <p className="text-gray-600 text-xs">
              Erstelle zuerst ein Template auf der Workouts-Seite.
            </p>
          ) : (
            <select
              onChange={(e) => {
                const t = templates.find((t) => t.id === e.target.value);
                if (t) addEntry(t);
                e.target.value = "";
              }}
              value=""
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400 focus:outline-none"
            >
              <option value="" disabled>
                + Template hinzufügen…
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          {saveError && <p className="text-red-400 text-xs">{saveError}</p>}

          <button
            onClick={handleSaveConfig}
            disabled={saving || cfgEntries.length === 0}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white font-medium py-2 rounded-lg text-sm transition-colors"
          >
            {saving ? "Wird gespeichert…" : "Zyklus speichern"}
          </button>
        </div>
      )}
    </div>
  );
}
