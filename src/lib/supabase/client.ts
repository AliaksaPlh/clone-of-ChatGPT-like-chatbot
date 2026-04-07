import { createBrowserClient } from "@supabase/ssr";

import {
  getSupabaseBrowserEnv,
  isValidSupabaseUrl,
} from "@/lib/supabase/validate-env";

/**
 * check .env and if valid https URL
 */
export const createClient = () => {
  const { url, anonKey } = getSupabaseBrowserEnv();

  if (!url || !anonKey || !isValidSupabaseUrl(url)) {
    throw new Error(
      "Supabase is not configured: set valid NEXT_PUBLIC_SUPABASE_URL (https://…) and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.",
    );
  }

  return createBrowserClient(url, anonKey);
};
