import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Workout, WorkoutExercise } from "@/types/workout";

export function saveWorkout(
  uid: string,
  name: string,
  exercises: WorkoutExercise[]
): Promise<void> {
  return addDoc(collection(db, "users", uid, "workouts"), {
    name,
    date: serverTimestamp(),
    exercises,
  }).then(() => undefined);
}

export function subscribeToWorkouts(
  uid: string,
  onData: (workouts: Workout[]) => void
): () => void {
  const q = query(
    collection(db, "users", uid, "workouts"),
    orderBy("date", "desc")
  );
  return onSnapshot(q, (snap) => {
    onData(
      snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Workout))
    );
  });
}
