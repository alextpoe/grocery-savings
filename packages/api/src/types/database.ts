export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipe_templates: {
        Row: {
          assumed_staples: string[]
          created_at: string
          description: string
          dietary_tags: string[]
          id: string
          instructions: string[]
          name: string
          servings: number
          slots: Json
        }
        Insert: {
          assumed_staples?: string[]
          created_at?: string
          description: string
          dietary_tags?: string[]
          id?: string
          instructions: string[]
          name: string
          servings: number
          slots: Json
        }
        Update: {
          assumed_staples?: string[]
          created_at?: string
          description?: string
          dietary_tags?: string[]
          id?: string
          instructions?: string[]
          name?: string
          servings?: number
          slots?: Json
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          category: Database["public"]["Enums"]["item_category"]
          created_at: string
          dietary_flags: string[]
          discount_percent: number | null
          id: string
          ingredient_key: string
          name: string
          regular_price: number
          sale_ends_at: string
          sale_price: number
          sale_starts_at: string
          servings_per_unit: number
          store_id: string
          unit: string
        }
        Insert: {
          category: Database["public"]["Enums"]["item_category"]
          created_at?: string
          dietary_flags?: string[]
          discount_percent?: number | null
          id?: string
          ingredient_key: string
          name: string
          regular_price: number
          sale_ends_at: string
          sale_price: number
          sale_starts_at: string
          servings_per_unit: number
          store_id: string
          unit: string
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"]
          created_at?: string
          dietary_flags?: string[]
          discount_percent?: number | null
          id?: string
          ingredient_key?: string
          name?: string
          regular_price?: number
          sale_ends_at?: string
          sale_price?: number
          sale_starts_at?: string
          servings_per_unit?: number
          store_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_meal_plans: {
        Row: {
          created_at: string
          id: string
          plan: Json
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan: Json
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan?: Json
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string
          chain: Database["public"]["Enums"]["store_chain"]
          city: string
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string
          state: string
          zip: string
        }
        Insert: {
          address: string
          chain: Database["public"]["Enums"]["store_chain"]
          city: string
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          state: string
          zip: string
        }
        Update: {
          address?: string
          chain?: Database["public"]["Enums"]["store_chain"]
          city?: string
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          state?: string
          zip?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          budget_per_serving: number
          created_at: string
          dietary_restrictions: string[]
          household_size: number
          min_discount_percent: number
          radius_miles: number
          updated_at: string
          user_id: string
          zip: string
        }
        Insert: {
          budget_per_serving?: number
          created_at?: string
          dietary_restrictions?: string[]
          household_size?: number
          min_discount_percent?: number
          radius_miles?: number
          updated_at?: string
          user_id: string
          zip: string
        }
        Update: {
          budget_per_serving?: number
          created_at?: string
          dietary_restrictions?: string[]
          household_size?: number
          min_discount_percent?: number
          radius_miles?: number
          updated_at?: string
          user_id?: string
          zip?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      item_category:
        | "produce"
        | "meat"
        | "seafood"
        | "dairy"
        | "bakery"
        | "pantry"
        | "frozen"
        | "deli"
        | "beverages"
        | "other"
      store_chain: "kroger" | "aldi" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// Project-convention aliases consumed across packages/api (queries, mutations,
// hooks). The supabase CLI emits Tables/TablesInsert/TablesUpdate; this repo
// uses Tables<'x'> for the Row plus InsertTables/UpdateTables and named row
// aliases. Re-export them here so `pnpm db:generate` does not break consumers.
export type InsertTables<
  T extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][T]["Insert"]
export type UpdateTables<
  T extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][T]["Update"]

export type Profile = Tables<"profiles">


