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
    PostgrestVersion: "14.17"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      Assets: {
        Row: {
          category: string
          condition: Database["public"]["Enums"]["asset_condition"] | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_deleted: boolean | null
          name: string
          quantity: number
          status: Database["public"]["Enums"]["asset_status"] | null
          target_qr_identifier: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          condition?: Database["public"]["Enums"]["asset_condition"] | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          name: string
          quantity?: number
          status?: Database["public"]["Enums"]["asset_status"] | null
          target_qr_identifier?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          condition?: Database["public"]["Enums"]["asset_condition"] | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          name?: string
          quantity?: number
          status?: Database["public"]["Enums"]["asset_status"] | null
          target_qr_identifier?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      AuditLogs: {
        Row: {
          action: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          state_changes: Json | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id: string
          state_changes?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          state_changes?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "AuditLogs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          },
        ]
      }
      BorrowRequestItems: {
        Row: {
          asset_id: string | null
          borrow_request_id: string | null
          id: string
          quantity: number
        }
        Insert: {
          asset_id?: string | null
          borrow_request_id?: string | null
          id?: string
          quantity: number
        }
        Update: {
          asset_id?: string | null
          borrow_request_id?: string | null
          id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "BorrowRequestItems_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "Assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "BorrowRequestItems_borrow_request_id_fkey"
            columns: ["borrow_request_id"]
            isOneToOne: false
            referencedRelation: "BorrowRequests"
            referencedColumns: ["id"]
          },
        ]
      }
      BorrowRequests: {
        Row: {
          additional_info: string | null
          borrower_contact_name: string | null
          borrower_email: string | null
          borrower_phone: string | null
          course_year_section: string | null
          created_at: string | null
          id: string
          letter_file_url: string | null
          organization_name: string | null
          purpose: string | null
          rejection_reason: string | null
          released_at: string | null
          requested_end_date: string | null
          requested_item: string | null
          requested_start_date: string | null
          returned_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["borrow_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          additional_info?: string | null
          borrower_contact_name?: string | null
          borrower_email?: string | null
          borrower_phone?: string | null
          course_year_section?: string | null
          created_at?: string | null
          id?: string
          letter_file_url?: string | null
          organization_name?: string | null
          purpose?: string | null
          rejection_reason?: string | null
          released_at?: string | null
          requested_end_date?: string | null
          requested_item?: string | null
          requested_start_date?: string | null
          returned_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["borrow_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          additional_info?: string | null
          borrower_contact_name?: string | null
          borrower_email?: string | null
          borrower_phone?: string | null
          course_year_section?: string | null
          created_at?: string | null
          id?: string
          letter_file_url?: string | null
          organization_name?: string | null
          purpose?: string | null
          rejection_reason?: string | null
          released_at?: string | null
          requested_end_date?: string | null
          requested_item?: string | null
          requested_start_date?: string | null
          returned_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["borrow_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "BorrowRequests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "BorrowRequests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          },
        ]
      }
      ContactMessages: {
        Row: {
          concern: string
          contact_number: string | null
          course_year_section: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          organization: string | null
          purpose: string | null
        }
        Insert: {
          concern: string
          contact_number?: string | null
          course_year_section?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          organization?: string | null
          purpose?: string | null
        }
        Update: {
          concern?: string
          contact_number?: string | null
          course_year_section?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          organization?: string | null
          purpose?: string | null
        }
        Relationships: []
      }
      Events: {
        Row: {
          content_description: string | null
          created_at: string | null
          created_by: string | null
          event_date: string | null
          id: string
          image_url: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content_description?: string | null
          created_at?: string | null
          created_by?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content_description?: string | null
          created_at?: string | null
          created_by?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          },
        ]
      }
      FAQItems: {
        Row: {
          answer: string
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      Officers: {
        Row: {
          academic_year: string | null
          created_at: string | null
          department: string | null
          display_order: number | null
          email: string | null
          full_name: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          position_title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          academic_year?: string | null
          created_at?: string | null
          department?: string | null
          display_order?: number | null
          email?: string | null
          full_name?: string | null
          id: string
          image_url?: string | null
          is_active?: boolean | null
          position_title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          academic_year?: string | null
          created_at?: string | null
          department?: string | null
          display_order?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          position_title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Officers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          },
        ]
      }
      SiteContent: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "SiteContent_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          },
        ]
      }
      Users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          organization_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          organization_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          organization_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_server_time: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_authorized: { Args: never; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_state_changes: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      asset_condition: "Excellent" | "Good" | "Fair" | "Poor"
      asset_status:
        | "Available"
        | "Reserved"
        | "Borrowed"
        | "Maintenance"
        | "Lost"
      borrow_status:
        | "Pending"
        | "Approved"
        | "Rejected"
        | "Active"
        | "Returned"
        | "Cancelled"
      event_status: "Draft" | "Published"
      user_role: "Admin" | "Default" | "Organization" | "Pending"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      asset_condition: ["Excellent", "Good", "Fair", "Poor"],
      asset_status: [
        "Available",
        "Reserved",
        "Borrowed",
        "Maintenance",
        "Lost",
      ],
      borrow_status: [
        "Pending",
        "Approved",
        "Rejected",
        "Active",
        "Returned",
        "Cancelled",
      ],
      event_status: ["Draft", "Published"],
      user_role: ["Admin", "Default", "Organization", "Pending"],
    },
  },
} as const
