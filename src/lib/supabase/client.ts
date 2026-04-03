import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ProductDatabase } from '../../types/productSchema';

let browserClient: SupabaseClient<ProductDatabase> | null = null;

function getSupabaseKey() {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
}

export function isSupabaseConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && getSupabaseKey());
}

export function getSupabaseClient() {
  const supabaseKey = getSupabaseKey();

  if (!isSupabaseConfigured()) {
    throw new Error('Supabase environment variables are missing. Set VITE_SUPABASE_URL and either VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY.');
  }

  if (!browserClient) {
    browserClient = createClient<ProductDatabase>(
      import.meta.env.VITE_SUPABASE_URL,
      supabaseKey!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  return browserClient;
}