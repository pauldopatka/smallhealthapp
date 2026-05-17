import {
  collection, addDoc, onSnapshot, query, orderBy,
  doc, updateDoc, deleteDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Recipe } from "@/types/recipe";

type NewRecipe = Omit<Recipe, "id" | "createdAt" | "rating">;

export function saveRecipe(uid: string, data: NewRecipe): Promise<void> {
  return addDoc(collection(db, "users", uid, "recipes"), {
    ...data,
    rating: 0,
    createdAt: serverTimestamp(),
  }).then(() => undefined);
}

export function subscribeToRecipes(
  uid: string,
  onData: (recipes: Recipe[]) => void
): () => void {
  const q = query(
    collection(db, "users", uid, "recipes"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) =>
    onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recipe)))
  );
}

export function subscribeToRecipe(
  uid: string,
  id: string,
  onData: (recipe: Recipe | null) => void
): () => void {
  return onSnapshot(doc(db, "users", uid, "recipes", id), (snap) =>
    onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as Recipe) : null)
  );
}

export function updateRating(uid: string, id: string, rating: number): Promise<void> {
  return updateDoc(doc(db, "users", uid, "recipes", id), { rating }).then(() => undefined);
}

export function deleteRecipe(uid: string, id: string): Promise<void> {
  return deleteDoc(doc(db, "users", uid, "recipes", id)).then(() => undefined);
}
