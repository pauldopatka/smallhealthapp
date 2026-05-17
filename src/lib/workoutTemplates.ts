import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { WorkoutTemplate, TemplateExercise } from "@/types/workout";

export function saveTemplate(
  uid: string,
  name: string,
  exercises: TemplateExercise[]
): Promise<void> {
  const cleaned = exercises.map((ex) => ({
    name: ex.name,
    unit: ex.unit,
    sets: ex.sets.map((s) =>
      s.targetReps != null ? { targetReps: s.targetReps } : {}
    ),
  }));
  return addDoc(collection(db, "users", uid, "workoutTemplates"), {
    name,
    exercises: cleaned,
  }).then(() => undefined);
}

export function subscribeToTemplates(
  uid: string,
  onData: (templates: WorkoutTemplate[]) => void
): () => void {
  const q = query(
    collection(db, "users", uid, "workoutTemplates"),
    orderBy("name", "asc")
  );
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WorkoutTemplate)));
  });
}
