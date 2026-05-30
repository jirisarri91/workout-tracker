export interface Exercise {
  id: string;
  name: string;
  instructions: string | null;
  muscle_groups: string[];
  resources: { title: string; url: string }[];
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlan {
  id: string;
  date: string;
  name: string | null;
  objective: string | null;
  notes: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
  exercises?: WorkoutPlanExercise[];
}

export interface WorkoutPlanExercise {
  id: string;
  workout_plan_id: string;
  exercise_id: string;
  block_name: string | null;
  order_index: number;
  sets: number | null;
  reps: number | null;
  duration_seconds: number | null;
  target_weight: number | null;
  rest_seconds: number | null;
  notes: string | null;
  created_at: string;
  exercise?: Exercise;
}

export type DayStatus = 'planned' | 'done' | 'skipped' | 'sport' | 'swim' | 'walk' | 'row';

export interface WorkoutSession {
  id: string;
  workout_plan_id: string | null;
  date: string;
  status: DayStatus;
  actual_start_time: string | null;
  actual_end_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  exercises?: WorkoutSessionExercise[];
}

export type ExerciseStatus = 'done' | 'not_done' | 'replaced';

export interface WorkoutSessionExercise {
  id: string;
  workout_session_id: string;
  workout_plan_exercise_id: string | null;
  exercise_id: string;
  order_index: number;
  status: ExerciseStatus;
  replaced_exercise_id: string | null;
  sets: number | null;
  reps: number | null;
  actual_weight: number | null;
  duration_seconds: number | null;
  observations: string | null;
  created_at: string;
  updated_at: string;
  exercise?: Exercise;
  replaced_exercise?: Exercise;
}

export interface UserObjectives {
  id: string;
  objective_text: string | null;
  strategy_text: string | null;
  birthday: string | null;
  updated_at: string;
}

export interface WeightEntry {
  id: string;
  date: string;
  weight_kg: number;
  notes: string | null;
  created_at: string;
}

export interface Mesocycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  goal: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIDigest {
  id: string;
  week_start: string;
  content: string;
  created_at: string;
}

export interface ExerciseProgressPoint {
  date: string;
  weight: number | null;
  reps: number | null;
  sets: number | null;
  volume: number | null;
  isPR: boolean;
}

export interface ProgressSuggestion {
  exerciseId: string;
  lastWeight: number | null;
  suggestedWeight: number | null;
  lastDate: string | null;
}
