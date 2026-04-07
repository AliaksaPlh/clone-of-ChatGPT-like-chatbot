import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  getSupabaseBrowserEnv,
  isValidSupabaseUrl,
} from "@/lib/supabase/validate-env";

export const middleware = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url: supabaseUrl, anonKey: supabaseKey } = getSupabaseBrowserEnv();

  if (!supabaseUrl || !supabaseKey || !isValidSupabaseUrl(supabaseUrl)) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return supabaseResponse;
};

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
