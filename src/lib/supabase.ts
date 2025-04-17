
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Use environment variables if available, otherwise use these placeholder values
// In production, these should be set properly in your environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
