
export interface FormField {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
}

export interface FormConfig {
  id?: string;
  title: string;
  description: string;
  fields: FormField[];
  category?: 'anamnese-dieta' | 'feedback' | 'livre' | 'anamnese-treino' | 'anamnese-suplementacao';
  createdAt?: string;
  updatedAt?: string;
  user_id?: string;
}

export interface FormResponse {
  [key: string]: any;
  id?: string;
  submittedAt?: string;
}

export interface SupabaseFormResponse {
  id: string;
  form_id: string;
  response_data: any;
  submitted_at: string;
  created_at: string;
  user_id?: string;
}
