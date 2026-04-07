"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseBrowserConfigured } from "@/lib/supabase/validate-env";

export const LoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabaseConfigured = isSupabaseBrowserConfigured();

  const handleLogin = async () => {
    setMessage(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setMessage("Could not sign in. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setMessage(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.session) {
        router.push("/");
        router.refresh();
        return;
      }

      setMessage("Check your email to confirm your account before signing in.");
    } catch {
      setMessage("Could not sign up. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!supabaseConfigured) {
    return (
      <div
        className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#111214] p-6 text-white"
        data-test-id="login-missing-env"
      >
        <p className="text-sm text-white/80">
          Supabase is not configured. Add{" "}
          <code className="rounded bg-white/10 px-1 text-xs">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-white/10 px-1 text-xs">
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
          </code>{" "}
          to your environment.
        </p>
        <Link
          className="inline-flex w-full items-center justify-center rounded-2xl bg-white py-3 text-sm font-semibold text-black hover:bg-white/90"
          href="/"
        >
          Back to chat
        </Link>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#111214] p-6 text-white"
      data-test-id="login-form"
    >
      <div>
        <h1 className="text-lg font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-white/60">
          Use your Supabase email and password.
        </p>
      </div>

      <label className="block text-sm font-medium text-white/80">
        Email
        <input
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
          data-test-id="login-email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          type="email"
          value={email}
        />
      </label>

      <label className="block text-sm font-medium text-white/80">
        Password
        <input
          autoComplete="current-password"
          className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
          data-test-id="login-password"
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          type="password"
          value={password}
        />
      </label>

      {message ? (
        <p
          className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100"
          data-test-id="login-message"
          role="alert"
        >
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button
          className="w-full rounded-2xl py-3"
          data-test-id="login-submit"
          disabled={isLoading || !email.trim() || !password}
          onClick={handleLogin}
          type="button"
          variant="dark"
        >
          {isLoading ? "Signing in…" : "Log in"}
        </Button>
        <Button
          className="w-full rounded-2xl border border-white/15 py-3 text-white hover:bg-white/10 disabled:text-white/40"
          data-test-id="login-signup"
          disabled={isLoading || !email.trim() || !password}
          onClick={handleSignup}
          type="button"
          variant="ghost"
        >
          Sign up
        </Button>
      </div>

      <Link
        className="block w-full rounded-2xl py-3 text-center text-sm text-white/70 hover:text-white"
        href="/"
      >
        Back to chat
      </Link>
    </div>
  );
};
