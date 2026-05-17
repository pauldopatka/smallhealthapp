import { Timestamp } from "firebase/firestore";

export interface MealEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: Timestamp;
  dateKey: string;
}

export interface NutritionGoal {
  calorieGoal: number;
}
