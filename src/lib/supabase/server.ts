import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import {
  getSupabaseBrowserEnv,
  isValidSupabaseUrl,
} from "@/lib/supabase/validate-env";

export const createClient = async () => {
  const cookieStore = await cookies();

  const { url: supabaseUrl, anonKey: supabaseKey } = getSupabaseBrowserEnv();

  if (!supabaseUrl || !supabaseKey || !isValidSupabaseUrl(supabaseUrl)) {
    throw new Error(
      "Missing or invalid NEXT_PUBLIC_SUPABASE_URL (must be https://…) or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.",
    );
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          console.error("Failed to set cookie");
        }
      },
    },
  });
};
