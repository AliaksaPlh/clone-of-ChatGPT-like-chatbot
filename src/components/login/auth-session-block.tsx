"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type User } from "@supabase/supabase-js";
import { Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InfoBanner } from "@/components/ui/info-banner";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseBrowserConfigured } from "@/lib/supabase/validate-env";
import { type UserSession } from "@/types/chat";

type AuthSessionBlockProps = {
  session?: UserSession;
};

export const AuthSessionBlock = ({ session }: AuthSessionBlockProps) => {
  const router = useRouter();
  const configured = isSupabaseBrowserConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(() => !configured);

  useEffect(() => {
    if (!configured) {
      return;
    }

    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setUser(nextSession?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  const handleSignOut = async () => {
    if (!configured) {
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  const promptLine =
    session && !session.isAnonymous
      ? "Unlimited prompts for your signed-in app session."
      : session
        ? `${session.usedFreePrompts} of 3 free prompts used.`
        : "3 free prompts available.";

  if (!configured) {
    return (
      <InfoBanner
        action={
          <span className="text-xs text-amber-50/60">
            Add Supabase env vars to enable sign-in.
          </span>
        }
        className="border-amber-400/20 bg-amber-400/10 text-amber-100"
        description={
          <span className="text-amber-50/70">
            {promptLine} Anonymous chat works without auth.
          </span>
        }
        icon={<Lock className="size-4" />}
        title="Anonymous access"
      />
    );
  }

  if (!ready) {
    return (
      <div className="rounded-2xl border border-white/10 p-4 text-xs text-white/50">
        Loading account…
      </div>
    );
  }

  if (user) {
    return (
      <InfoBanner
        action={
          <Button
            className="w-full rounded-xl border border-white/20 text-white hover:bg-white/10"
            data-test-id="auth-sign-out"
            onClick={handleSignOut}
            type="button"
            variant="ghost"
          >
            Sign out
          </Button>
        }
        className="border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
        description={
          <span className="text-emerald-50/80">
            {promptLine}{" "}
            <span className="block truncate pt-1 text-emerald-100/90">
              {user.email}
            </span>
          </span>
        }
        icon={<Mail className="size-4 text-emerald-200" />}
        title="Signed in"
      />
    );
  }

  return (
    <InfoBanner
      action={
        <Link
          className="inline-flex w-full items-center justify-center rounded-xl bg-white py-2.5 text-sm font-semibold text-black hover:bg-white/90"
          data-test-id="auth-login-link"
          href="/login"
        >
          Log in
        </Link>
      }
      className="border-amber-400/20 bg-amber-400/10 text-amber-100"
      description={
        <span className="text-amber-50/70">
          {promptLine} Sign in with Supabase to use a stable account on this
          device.
        </span>
      }
      icon={<Lock className="size-4" />}
      title="Anonymous access"
    />
  );
};
