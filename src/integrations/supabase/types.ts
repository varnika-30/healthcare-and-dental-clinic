export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string;
          created_by: string | null;
          doctor_id: string | null;
          duration_minutes: number;
          id: string;
          notes: string | null;
          patient_id: string;
          priority: Database["public"]["Enums"]["appointment_priority"];
          appointment_date: string;
          service: string;
          status: Database["public"]["Enums"]["appointment_status"];
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          doctor_id?: string | null;
          duration_minutes?: number;
          id?: string;
          notes?: string | null;
          patient_id: string;
          priority?: Database["public"]["Enums"]["appointment_priority"];
          appointment_date?: string;
          service: string;
          status?: Database["public"]["Enums"]["appointment_status"];
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          doctor_id?: string | null;
          duration_minutes?: number;
          id?: string;
          notes?: string | null;
          patient_id?: string;
          priority?: Database["public"]["Enums"]["appointment_priority"];
          appointment_date?: string;
          service?: string;
          status?: Database["public"]["Enums"]["appointment_status"];
        };
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      family_links: {
        Row: {
          created_at: string;
          id: string;
          patient_id: string;
          related_name: string;
          related_patient_id: string | null;
          relationship: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          patient_id: string;
          related_name: string;
          related_patient_id?: string | null;
          relationship?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          patient_id?: string;
          related_name?: string;
          related_patient_id?: string | null;
          relationship?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "family_links_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "family_links_related_patient_id_fkey";
            columns: ["related_patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_items: {
        Row: {
          amount: number;
          created_at: string;
          description: string;
          id: string;
          invoice_id: string;
          quantity: number;
          unit_price: number;
        };
        Insert: {
          amount?: number;
          created_at?: string;
          description: string;
          id?: string;
          invoice_id: string;
          quantity?: number;
          unit_price?: number;
        };
        Update: {
          amount?: number;
          created_at?: string;
          description?: string;
          id?: string;
          invoice_id?: string;
          quantity?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          amount_paid: number;
          balance: number;
          created_at: string;
          due_date: string | null;
          id: string;
          invoice_number: string;
          is_current: boolean;
          notes: string | null;
          patient_id: string;
          plan_id: string | null;
          status: Database["public"]["Enums"]["invoice_status"];
          subtotal: number;
          tax: number;
          total: number;
          updated_at: string;
        };
        Insert: {
          amount_paid?: number;
          balance?: number;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          invoice_number?: string;
          is_current?: boolean;
          notes?: string | null;
          patient_id: string;
          plan_id?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
          subtotal?: number;
          tax?: number;
          total?: number;
          updated_at?: string;
        };
        Update: {
          amount_paid?: number;
          balance?: number;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          invoice_number?: string;
          is_current?: boolean;
          notes?: string | null;
          patient_id?: string;
          plan_id?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
          subtotal?: number;
          tax?: number;
          total?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "treatment_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          read_at: string | null;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          title: string;
          type?: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          title?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          user_id?: string;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          allergies: string | null;
          blood_group: string | null;
          created_at: string;
          date_of_birth: string | null;
          email: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          family_head_id: string | null;
          full_name: string;
          gender: string | null;
          id: string;
          medical_notes: string | null;
          phone: string | null;
          relationship_to_head: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          allergies?: string | null;
          blood_group?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          family_head_id?: string | null;
          full_name: string;
          gender?: string | null;
          id?: string;
          medical_notes?: string | null;
          phone?: string | null;
          relationship_to_head?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          allergies?: string | null;
          blood_group?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          family_head_id?: string | null;
          full_name?: string;
          gender?: string | null;
          id?: string;
          medical_notes?: string | null;
          phone?: string | null;
          relationship_to_head?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "patients_family_head_id_fkey";
            columns: ["family_head_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_transactions: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          notes: string | null;
          patient_id: string;
          payment_date: string;
          payment_method: Database["public"]["Enums"]["payment_method"];
          plan_id: string | null;
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          notes?: string | null;
          patient_id: string;
          payment_date?: string;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          plan_id?: string | null;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          notes?: string | null;
          patient_id?: string;
          payment_date?: string;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          plan_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_transactions_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_transactions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "treatment_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          created_by: string | null;
          id: string;
          invoice_id: string;
          method: Database["public"]["Enums"]["payment_method"];
          paid_at: string;
          reference: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invoice_id: string;
          method?: Database["public"]["Enums"]["payment_method"];
          paid_at?: string;
          reference?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invoice_id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          paid_at?: string;
          reference?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      prescription_items: {
        Row: {
          created_at: string;
          dosage: string | null;
          duration: string | null;
          frequency: string | null;
          id: string;
          instructions: string | null;
          medication: string;
          prescription_id: string;
        };
        Insert: {
          created_at?: string;
          dosage?: string | null;
          duration?: string | null;
          frequency?: string | null;
          id?: string;
          instructions?: string | null;
          medication: string;
          prescription_id: string;
        };
        Update: {
          created_at?: string;
          dosage?: string | null;
          duration?: string | null;
          frequency?: string | null;
          id?: string;
          instructions?: string | null;
          medication?: string;
          prescription_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey";
            columns: ["prescription_id"];
            isOneToOne: false;
            referencedRelation: "prescriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      prescriptions: {
        Row: {
          appointment_id: string | null;
          created_at: string;
          diagnosis: string | null;
          doctor_id: string | null;
          id: string;
          issued_at: string;
          notes: string | null;
          patient_id: string;
          updated_at: string;
        };
        Insert: {
          appointment_id?: string | null;
          created_at?: string;
          diagnosis?: string | null;
          doctor_id?: string | null;
          id?: string;
          issued_at?: string;
          notes?: string | null;
          patient_id: string;
          updated_at?: string;
        };
        Update: {
          appointment_id?: string | null;
          created_at?: string;
          diagnosis?: string | null;
          doctor_id?: string | null;
          id?: string;
          issued_at?: string;
          notes?: string | null;
          patient_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          date_of_birth: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          specialization: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          specialization?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          specialization?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      queue_tokens: {
        Row: {
          appointment_id: string | null;
          called_at: string | null;
          created_at: string;
          done_at: string | null;
          id: string;
          patient_id: string;
          queued_at: string;
          status: Database["public"]["Enums"]["queue_status"];
          token_number: number;
          updated_at: string;
        };
        Insert: {
          appointment_id?: string | null;
          called_at?: string | null;
          created_at?: string;
          done_at?: string | null;
          id?: string;
          patient_id: string;
          queued_at?: string;
          status?: Database["public"]["Enums"]["queue_status"];
          token_number: number;
          updated_at?: string;
        };
        Update: {
          appointment_id?: string | null;
          called_at?: string | null;
          created_at?: string;
          done_at?: string | null;
          id?: string;
          patient_id?: string;
          queued_at?: string;
          status?: Database["public"]["Enums"]["queue_status"];
          token_number?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "queue_tokens_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "queue_tokens_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };

      appointment_clinical_records: {
        Row: {
          id: string;
          appointment_id: string;
          chief_complaint: string | null;
          extra_oral_examination: string | null;
          oral_examination: string | null;
          treatment_advised: string | null;
          clinical_notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          chief_complaint?: string | null;
          extra_oral_examination?: string | null;
          oral_examination?: string | null;
          treatment_advised?: string | null;
          clinical_notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          chief_complaint?: string | null;
          extra_oral_examination?: string | null;
          oral_examination?: string | null;
          treatment_advised?: string | null;
          clinical_notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "appointment_clinical_records_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };

      tooth_treatments: {
        Row: {
          created_at: string;
          doctor_id: string | null;
          id: string;
          notes: string | null;
          patient_id: string;
          performed_at: string | null;
          plan_id: string | null;
          procedure: string;
          status: Database["public"]["Enums"]["tooth_treatment_status"];
          tooth_number: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          doctor_id?: string | null;
          id?: string;
          notes?: string | null;
          patient_id: string;
          performed_at?: string | null;
          plan_id?: string | null;
          procedure: string;
          status?: Database["public"]["Enums"]["tooth_treatment_status"];
          tooth_number: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          doctor_id?: string | null;
          id?: string;
          notes?: string | null;
          patient_id?: string;
          performed_at?: string | null;
          plan_id?: string | null;
          procedure?: string;
          status?: Database["public"]["Enums"]["tooth_treatment_status"];
          tooth_number?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tooth_treatments_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tooth_treatments_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "treatment_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      treatment_plans: {
        Row: {
          created_at: string;
          description: string | null;
          doctor_id: string | null;
          id: string;
          patient_id: string;
          start_date: string | null;
          end_date: string | null;
          status: Database["public"]["Enums"]["treatment_status"];
          title: string;
          updated_at: string;
          lab_status: string | null;
          follow_up_status: string | null;
          paid_amount: number | null;
          due_date: string | null;
          payment_status: string | null;
          estimated_cost: number | null;
          actual_cost: number | null;
          follow_up_needed: boolean | null;
          discount_amount: number;
          discount_reason: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          doctor_id?: string | null;
          id?: string;
          patient_id: string;
          start_date?: string | null;
          end_date?: string | null;
          status?: Database["public"]["Enums"]["treatment_status"];
          title: string;
          updated_at?: string;
          lab_status?: string | null;
          follow_up_status?: string | null;
          paid_amount?: number | null;
          due_date?: string | null;
          payment_status?: string | null;
          estimated_cost?: number | null;
          actual_cost?: number | null;
          follow_up_needed?: boolean | null;
          discount_amount?: number;
          discount_reason?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          doctor_id?: string | null;
          id?: string;
          patient_id?: string;
          start_date?: string | null;
          end_date?: string | null;
          status?: Database["public"]["Enums"]["treatment_status"];
          title?: string;
          updated_at?: string;
          lab_status?: string | null;
          follow_up_status?: string | null;
          paid_amount?: number | null;
          due_date?: string | null;
          payment_status?: string | null;
          estimated_cost?: number | null;
          actual_cost?: number | null;
          follow_up_needed?: boolean | null;
          discount_amount?: number;
          discount_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "treatment_plans_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      treatment_steps: {
        Row: {
          completed_at: string | null;
          created_at: string;
          due_at: string | null;
          id: string;
          notes: string | null;
          plan_id: string;
          status: Database["public"]["Enums"]["step_status"];
          step_order: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          notes?: string | null;
          plan_id: string;
          status?: Database["public"]["Enums"]["step_status"];
          step_order: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          notes?: string | null;
          plan_id?: string;
          status?: Database["public"]["Enums"]["step_status"];
          step_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "treatment_steps_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "treatment_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_staff: { Args: { _uid: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "doctor" | "receptionist" | "patient";
      appointment_priority: "normal" | "urgent" | "emergency";
      appointment_status:
        | "requested"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show";
      invoice_status: "draft" | "issued" | "partial" | "paid" | "void";
      notification_type: "reminder" | "followup" | "billing" | "system";
      payment_method: "cash" | "card" | "upi" | "bank_transfer" | "insurance" | "other";
      queue_status: "waiting" | "in_room" | "done" | "no_show";
      step_status: "pending" | "in_progress" | "completed" | "skipped";
      tooth_treatment_status: "planned" | "in_progress" | "completed";
      treatment_status: "planned" | "in_progress" | "completed" | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "doctor", "receptionist", "patient"],
      appointment_priority: ["normal", "urgent", "emergency"],
      appointment_status: [
        "requested",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      invoice_status: ["draft", "issued", "partial", "paid", "void"],
      notification_type: ["reminder", "followup", "billing", "system"],
      payment_method: ["cash", "card", "upi", "bank_transfer", "insurance", "other"],
      queue_status: ["waiting", "in_room", "done", "no_show"],
      step_status: ["pending", "in_progress", "completed", "skipped"],
      tooth_treatment_status: ["planned", "in_progress", "completed"],
      treatment_status: ["planned", "in_progress", "completed", "cancelled"],
    },
  },
} as const;
