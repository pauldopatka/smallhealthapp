import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { WeightEntry } from "@/types/weight";
import type { Unit } from "@/types/workout";

export function saveWeight(uid: string, weight: number, unit: Unit): Promise<void> {
  return addDoc(collection(db, "users", uid, "weightEntries"), {
    weight,
    unit,
    date: serverTimestamp(),
  }).then(() => undefined);
}

export function subscribeToWeightEntries(
  uid: string,
  onData: (entries: WeightEntry[]) => void
): () => void {
  const q = query(
    collection(db, "users", uid, "weightEntries"),
    orderBy("date", "asc")
  );
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WeightEntry)));
  });
}
