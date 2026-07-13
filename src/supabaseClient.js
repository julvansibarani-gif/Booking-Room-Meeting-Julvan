import { createClient } from '@supabase/supabase-js';

console.log('URL SUPABASE:', import.meta.env.VITE_SUPABASE_URL);

console.log('KEY ADA?', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'YES' : 'NO');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
