import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
// Accept full URLs like https://xxx.supabase.co/rest/v1/ — keep only the origin
const supabaseUrl = rawUrl ? new URL(rawUrl).origin : '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
