export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string
          metadata: Json | null
          name: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url: string
          metadata?: Json | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          metadata?: Json | null
          name?: string
        }
        Relationships: []
      }
      client_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          forms_completed: boolean
          id: string
          last_reset_date: string | null
          ltv: number | null
          plan_id: string
          responses_used: number | null
          service_type: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          forms_completed?: boolean
          id?: string
          last_reset_date?: string | null
          ltv?: number | null
          plan_id: string
          responses_used?: number | null
          service_type: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          forms_completed?: boolean
          id?: string
          last_reset_date?: string | null
          ltv?: number | null
          plan_id?: string
          responses_used?: number | null
          service_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_subscriptions_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_prescriptions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          file_name: string | null
          file_path: string | null
          form_response_id: string | null
          generation_payload: Json | null
          generation_status: string
          id: string
          model_slug: string | null
          plan_name: string
          plan_sequence: number
          raw_plan_text: string | null
          status: string | null
          structured_plan: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name?: string | null
          file_path?: string | null
          form_response_id?: string | null
          generation_payload?: Json | null
          generation_status?: string
          id?: string
          model_slug?: string | null
          plan_name: string
          plan_sequence: number
          raw_plan_text?: string | null
          status?: string | null
          structured_plan?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name?: string | null
          file_path?: string | null
          form_response_id?: string | null
          generation_payload?: Json | null
          generation_status?: string
          id?: string
          model_slug?: string | null
          plan_name?: string
          plan_sequence?: number
          raw_plan_text?: string | null
          status?: string | null
          structured_plan?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_diet_prescriptions_form_response"
            columns: ["form_response_id"]
            isOneToOne: false
            referencedRelation: "form_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_load_logs: {
        Row: {
          created_at: string
          exercise_name: string
          id: string
          load_unit: string
          load_value: number
          training_prescription_id: string
          user_id: string
          workout_label: string
          workout_title: string
        }
        Insert: {
          created_at?: string
          exercise_name: string
          id?: string
          load_unit: string
          load_value: number
          training_prescription_id: string
          user_id: string
          workout_label: string
          workout_title: string
        }
        Update: {
          created_at?: string
          exercise_name?: string
          id?: string
          load_unit?: string
          load_value?: number
          training_prescription_id?: string
          user_id?: string
          workout_label?: string
          workout_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_load_logs_training_prescription_id_fkey"
            columns: ["training_prescription_id"]
            isOneToOne: false
            referencedRelation: "training_prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_load_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      form_responses: {
        Row: {
          created_at: string
          form_id: string
          id: string
          plano_alimentar: string | null
          response_data: Json
          submitted_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          form_id: string
          id?: string
          plano_alimentar?: string | null
          response_data: Json
          submitted_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          form_id?: string
          id?: string
          plano_alimentar?: string | null
          response_data?: Json
          submitted_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      metabolic_assessments: {
        Row: {
          activity_factor: number
          age: number
          biological_sex: string
          created_at: string
          get_value: number
          height: number
          id: string
          tmb: number
          updated_at: string
          user_id: string
          waist_circumference: number
          weight: number
        }
        Insert: {
          activity_factor: number
          age: number
          biological_sex: string
          created_at?: string
          get_value: number
          height: number
          id?: string
          tmb: number
          updated_at?: string
          user_id: string
          waist_circumference: number
          weight: number
        }
        Update: {
          activity_factor?: number
          age?: number
          biological_sex?: string
          created_at?: string
          get_value?: number
          height?: number
          id?: string
          tmb?: number
          updated_at?: string
          user_id?: string
          waist_circumference?: number
          weight?: number
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activated: boolean
          ai_config: Json | null
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_completed: boolean | null
          unlimited_plan_enabled: boolean | null
          updated_at: string
          user_type: string
          whatsapp: string | null
        }
        Insert: {
          activated?: boolean
          ai_config?: Json | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          unlimited_plan_enabled?: boolean | null
          updated_at?: string
          user_type?: string
          whatsapp?: string | null
        }
        Update: {
          activated?: boolean
          ai_config?: Json | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          unlimited_plan_enabled?: boolean | null
          updated_at?: string
          user_type?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      protocolos: {
        Row: {
          dieta: Json | null
          id: number
          session_id: number
          treino: Json | null
        }
        Insert: {
          dieta?: Json | null
          id?: number
          session_id: number
          treino?: Json | null
        }
        Update: {
          dieta?: Json | null
          id?: number
          session_id?: number
          treino?: Json | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          id: string
          max_plans: number
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          id?: string
          max_plans: number
          name: string
          price: number
        }
        Update: {
          created_at?: string
          id?: string
          max_plans?: number
          name?: string
          price?: number
        }
        Relationships: []
      }
      training_periodization: {
        Row: {
          created_at: string
          current_objective: string
          id: string
          intensity: string
          methods: string
          status: string | null
          training_prescription_id: string | null
          training_volume: string
          updated_at: string
          user_id: string
          workouts: Json | null
        }
        Insert: {
          created_at?: string
          current_objective: string
          id?: string
          intensity: string
          methods: string
          status?: string | null
          training_prescription_id?: string | null
          training_volume: string
          updated_at?: string
          user_id: string
          workouts?: Json | null
        }
        Update: {
          created_at?: string
          current_objective?: string
          id?: string
          intensity?: string
          methods?: string
          status?: string | null
          training_prescription_id?: string | null
          training_volume?: string
          updated_at?: string
          user_id?: string
          workouts?: Json | null
        }
        Relationships: []
      }
      training_prescriptions: {
        Row: {
          created_at: string | null
          completed_at: string | null
          error_message: string | null
          file_name: string | null
          file_path: string | null
          form_response_id: string | null
          generation_payload: Json | null
          generation_status: string
          id: string
          model_slug: string | null
          plan_name: string
          plan_sequence: number
          raw_plan_text: string | null
          status: string | null
          structured_plan: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          file_name?: string | null
          file_path?: string | null
          form_response_id?: string | null
          generation_payload?: Json | null
          generation_status?: string
          id?: string
          model_slug?: string | null
          plan_name: string
          plan_sequence: number
          raw_plan_text?: string | null
          status?: string | null
          structured_plan?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          file_name?: string | null
          file_path?: string | null
          form_response_id?: string | null
          generation_payload?: Json | null
          generation_status?: string
          id?: string
          model_slug?: string | null
          plan_name?: string
          plan_sequence?: number
          raw_plan_text?: string | null
          status?: string | null
          structured_plan?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_forms: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          form_data: Json
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          form_data: Json
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          form_data?: Json
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_types: {
        Row: {
          created_at: string
          id: string
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          user_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      workout_checkins: {
        Row: {
          created_at: string
          id: string
          user_id: string
          workout_date: string
          workout_division: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          workout_date: string
          workout_division: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          workout_date?: string
          workout_division?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_maintain_unlimited_plans: { Args: never; Returns: undefined }
      auto_reset_monthly_forms: { Args: never; Returns: undefined }
      can_user_claim_badge: {
        Args: { badge_uuid: string; user_uuid: string }
        Returns: boolean
      }
      cancel_client_subscription: {
        Args: { subscription_id: string }
        Returns: boolean
      }
      change_client_plan_by_email: {
        Args: {
          client_email: string
          is_unlimited?: boolean
          new_plan_id: string
        }
        Returns: boolean
      }
      delete_client_account: { Args: { target_user_id: string }; Returns: boolean }
      create_training_prescription: {
        Args: {
          p_form_response_id: string
          p_generation_payload?: Json
          p_user_id: string
        }
        Returns: Database["public"]["Tables"]["training_prescriptions"]["Row"]
      }
      get_admin_ids: { Args: never; Returns: string[] }
      get_current_user_role: { Args: never; Returns: string }
      has_unlimited_plan: { Args: { user_id_param: string }; Returns: boolean }
      is_user_activation_expired: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      maintain_unlimited_plan_activation: { Args: never; Returns: undefined }
      match_documents: {
        Args: { filter: Json; match_count: number; query_embedding: string }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      reset_client_forms: { Args: { client_user_id: string }; Returns: boolean }
      reset_monthly_usage: { Args: never; Returns: undefined }
      reset_user_activation: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      sync_unlimited_plan_data: { Args: never; Returns: undefined }
      toggle_unlimited_plan: {
        Args: { client_user_id: string; enable_unlimited: boolean }
        Returns: boolean
      }
      update_expired_subscriptions: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
