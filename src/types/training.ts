export type TrainingGenerationStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "archived";

export interface StructuredTrainingCardio {
  protocol: string;
  frequency: string | null;
  method: string | null;
  duration: string | null;
  details: string | null;
  equipment: string | null;
}

export interface StructuredTrainingExercise {
  name: string;
  prescription: string;
  rest: string | null;
  method: string | null;
  muscle_group?: string | null;
  video_url?: string | null;
}

export interface StructuredTrainingWorkout {
  label: string;
  title: string;
  exercises: StructuredTrainingExercise[];
}

export interface StructuredTrainingPlan {
  header: {
    user_name: string;
    age: string;
    weight: string;
    contact: string;
    emphasis: string;
    stimulus: string;
    objective: string;
    split: string;
    time_away?: string;
    phase_duration?: string;
  };
  cardio: StructuredTrainingCardio | null;
  workouts: StructuredTrainingWorkout[];
  observations: string[];
}

export interface TrainingPeriodizationAnalysis {
  objetivo_treino: string;
  volume_total_series: number | null;
  intensidade_faixa_reps: string;
  metodo_utilizado: string;
}
