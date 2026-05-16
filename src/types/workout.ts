import { Timestamp } from "firebase/firestore";

export type Unit = "kg" | "lbs";

export interface WorkoutSet {
  reps: number;
  weight: number;
}

export interface WorkoutExercise {
  name: string;
  unit: Unit;
  notes: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  name: string;
  date: Timestamp;
  exercises: WorkoutExercise[];
}
