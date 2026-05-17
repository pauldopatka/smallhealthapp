import { Timestamp } from "firebase/firestore";

export const RECIPE_TAGS = [
  "Frühstück", "Mittagessen", "Abendessen", "Snack",
  "Bulking", "Cutting", "Dessert",
] as const;

export interface Recipe {
  id: string;
  title: string;
  ingredients: string;
  instructions: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portions: number;
  tags: string[];
  rating: number;
  createdAt: Timestamp;
}
