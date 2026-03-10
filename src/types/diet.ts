export type DietGenerationStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "archived";

export interface StructuredDietPlan {
  header: {
    user_name: string;
    age: string;
    weight: string;
    contact: string;
    objective: string;
    estimated_calories_kcal: number | null;
    macros: {
      proteins_g: number | null;
      carbs_g: number | null;
      fats_g: number | null;
    };
  };
  meals: Array<{
    meal_number: number;
    title: string;
    items: Array<{
      name: string;
      preparation: string | null;
      quantity: string;
      substitutions: Array<{
        name: string;
        quantity: string;
      }>;
    }>;
  }>;
  observations: {
    hydration: string | null;
    extra_notes: string[];
  };
}
