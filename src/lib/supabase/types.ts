import type { Session } from '@supabase/supabase-js';

export type { ApplicationRole } from '../../types/role';

export type Json =
  | boolean
  | number
  | string
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DatabaseRow = Record<string, unknown>;

type TableDefinition = {
  Row: DatabaseRow;
  Insert: DatabaseRow;
  Update: DatabaseRow;
  Relationships: [];
};

type PublicTables = {
  users: TableDefinition;
  roles: TableDefinition;
  user_roles: TableDefinition;
  user_preferences: TableDefinition;
  user_sessions: TableDefinition;
  farmer_profiles: TableDefinition;
  farm_locations: TableDefinition;
  farms: TableDefinition;
  categories: TableDefinition;
  units: TableDefinition;
  produce: TableDefinition;
  produce_quality: TableDefinition;
  physical_batches: TableDefinition;
  produce_activity: TableDefinition;
  produce_media: TableDefinition;
};

export interface Database {
  public: {
    Tables: PublicTables;
    Views: Record<string, never>;
    Functions: {
      get_demo_account_by_phone: { Args: { p_phone: string }; Returns: Json };
      get_demo_farmer_home_summary: { Args: { p_phone: string }; Returns: Json };
      get_demo_farmer_my_farm_summary: { Args: { p_phone: string }; Returns: Json };
      get_demo_notifications: { Args: { p_phone: string }; Returns: Json };
      mark_demo_notification_read: { Args: { p_phone: string; p_notification_id: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type Role = Database['public']['Tables']['roles']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type AuthSession = Session;
