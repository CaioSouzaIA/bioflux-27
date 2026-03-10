// Supabase client singleton - configured outside React tree
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://kllprstrjpeedlegkedp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_9RhFpGXYVoySs-M8AaHIfg_Qg90sOa5";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,           // Consistent storage for PWA/iframe
    persistSession: true,            // Maintain session across refreshes
    autoRefreshToken: true,          // Auto refresh tokens before expiry
    detectSessionInUrl: true,        // Handle auth redirects properly
    flowType: 'pkce',               // Use PKCE for better security
  }
});