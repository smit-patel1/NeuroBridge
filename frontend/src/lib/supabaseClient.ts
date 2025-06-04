import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zurfhydnztcxlomdyqds.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1cmZoeWRuenRjeGxvbWR5cWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MDU0OTgsImV4cCI6MjA2NDM4MTQ5OH0.dkARcN-izUnqNj1iscu_xfMsLGfOV1PWYUi6pg0TDGg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);