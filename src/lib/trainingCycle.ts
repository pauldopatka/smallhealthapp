import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CycleConfig } from "@/types/trainingCycle";

export function saveCycleConfig(uid: string, config: CycleConfig): Promise<void> {
  return setDoc(doc(db, "users", uid, "trainingCycle", "config"), config)
    .then(() => undefined);
}

export function subscribeToCycle(
  uid: string,
  onData: (config: CycleConfig | null) => void
): () => void {
  return onSnapshot(
    doc(db, "users", uid, "trainingCycle", "config"),
    (snap) => onData(snap.exists() ? (snap.data() as CycleConfig) : null)
  );
}

export function checkOffWorkout(uid: string, config: CycleConfig): Promise<void> {
  const todayKey = new Date().toLocaleDateString("sv-SE");
  if (config.lastCompletedDate === todayKey) return Promise.resolve();

  const updated: CycleConfig = {
    ...config,
    lastCompletedDate: todayKey,
  };
  if (config.mode === "queue" && config.entries.length > 0) {
    updated.currentIndex = (config.currentIndex + 1) % config.entries.length;
  }
  return setDoc(doc(db, "users", uid, "trainingCycle", "config"), updated)
    .then(() => undefined);
}
