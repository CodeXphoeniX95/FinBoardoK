import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (
      import.meta.env[`VITE_${key}`] ||
      import.meta.env[`REACT_APP_${key}`] ||
      import.meta.env[key]
    );
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[`REACT_APP_${key}`] || process.env[key];
  }
  return undefined;
};

const supabaseUrl =
  getEnvVar('SUPABASE_URL') ||
  'https://flxlhmznanbfbaubjdwi.supabase.co';

const supabaseAnonKey =
  getEnvVar('SUPABASE_ANON_KEY') ||
  getEnvVar('SUPABASE_KEY') ||
  'sb_publishable_755B1l0SXBMFZVsN8bDL4A_99p03272';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
