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

export interface TemplateSet {
  targetReps?: number;
}

export interface TemplateExercise {
  name: string;
  unit: Unit;
  sets: TemplateSet[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
}
