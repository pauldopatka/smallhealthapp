import {
  collection, addDoc, onSnapshot, query, where,
  setDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MealEntry, NutritionGoal } from "@/types/nutrition";

export function saveMeal(
  uid: string,
  dateKey: string,
  data: { name: string; calories: number; protein: number; carbs: number; fat: number }
): Promise<void> {
  return addDoc(collection(db, "users", uid, "mealEntries"), {
    ...data,
    dateKey,
    date: serverTimestamp(),
  }).then(() => undefined);
}

export function subscribeToMeals(
  uid: string,
  dateKey: string,
  onData: (meals: MealEntry[]) => void
): () => void {
  const q = query(
    collection(db, "users", uid, "mealEntries"),
    where("dateKey", "==", dateKey)
  );
  return onSnapshot(q, (snap) => {
    const meals = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as MealEntry))
      .sort((a, b) => (a.date?.toMillis?.() ?? 0) - (b.date?.toMillis?.() ?? 0));
    onData(meals);
  });
}

export function saveGoal(uid: string, calorieGoal: number): Promise<void> {
  return setDoc(
    doc(db, "users", uid, "nutritionSettings", "default"),
    { calorieGoal },
    { merge: true }
  ).then(() => undefined);
}

export function subscribeToGoal(
  uid: string,
  onData: (goal: NutritionGoal | null) => void
): () => void {
  return onSnapshot(
    doc(db, "users", uid, "nutritionSettings", "default"),
    (snap) => onData(snap.exists() ? (snap.data() as NutritionGoal) : null)
  );
}
