
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// We'll use the values from our connected Supabase project
const SUPABASE_URL = "https://iimqcrcghtehsnxetnfw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbXFjcmNnaHRlaHNueGV0bmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjgzODEsImV4cCI6MjA2MDUwNDM4MX0.Uc-JMoRi4Lf57us2j7epo6z_da_Wc4Fhc7ExDPUH1qY";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
