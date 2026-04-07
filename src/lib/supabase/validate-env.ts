export const isValidSupabaseUrl = (value: string) => {
  try {
    const parsed = new URL(value);

    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const getSupabaseBrowserEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ?? "";

  return { url, anonKey };
};

export const isSupabaseBrowserConfigured = () => {
  const { url, anonKey } = getSupabaseBrowserEnv();

  return Boolean(url && anonKey && isValidSupabaseUrl(url));
};
