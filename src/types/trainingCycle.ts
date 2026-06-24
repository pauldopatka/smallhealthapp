export interface CycleEntry {
  templateId: string;
  templateName: string;
  dayOfWeek?: number;
}

export interface CycleConfig {
  mode: "queue" | "weekday";
  entries: CycleEntry[];
  currentIndex: number;
  lastCompletedDate: string;
}
