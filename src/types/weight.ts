import { Timestamp } from "firebase/firestore";
import type { Unit } from "./workout";

export interface WeightEntry {
  id: string;
  weight: number;
  unit: Unit;
  date: Timestamp;
}
