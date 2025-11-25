import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SystemState {
  id: string;
  status: 'disarmed' | 'armed' | 'alert';
  last_updated: string;
  updated_by: string | null;
}

export interface ActivityLog {
  id: string;
  event_type: string;
  status_before: string | null;
  status_after: string | null;
  user_id: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}
