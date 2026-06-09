export interface SetLog {
  id: string;
  setNumber: number;
  weight: number; // in preferred unit (kg or lbs)
  reps: number;
  restTimeSeconds: number; // Rest time after this set
}

export interface ExerciseLog {
  id: string;
  exerciseName: string;
  category: string; // e.g., Chest, Back, Legs, Shoulders, Arms, Core, Cardio
  sets: SetLog[];
}

export interface DailyLog {
  date: string; // YYYY-MM-DD format
  exercises: ExerciseLog[];
  bodyWeight?: number; // Optional body weight log for the day
  notes?: string;
}

export type WeightUnit = 'kg' | 'lbs';

export interface UserSettings {
  weightUnit: WeightUnit;
}
