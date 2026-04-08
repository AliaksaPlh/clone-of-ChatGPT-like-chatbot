import { NextResponse } from "next/server";

import { chatStore } from "@/lib/chat-store";
import {
  applyAnonSessionCookieIfNeeded,
  resolveChatSession,
} from "@/lib/resolve-chat-session";
import { createClient } from "@/lib/supabase/server";
import {
  fetchAuthUserChats,
  insertAuthChat,
} from "@/lib/supabase/persisted-chats";

export const GET = async () => {
  const { sessionId, shouldSetAnonCookie, isAuthenticated } =
    await resolveChatSession();

  if (isAuthenticated) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await fetchAuthUserChats(supabase);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response = NextResponse.json({ data });

    await applyAnonSessionCookieIfNeeded(
      response,
      sessionId,
      shouldSetAnonCookie,
    );

    return response;
  }

  const response = NextResponse.json({
    data: chatStore.getChats(sessionId),
  });

  await applyAnonSessionCookieIfNeeded(
    response,
    sessionId,
    shouldSetAnonCookie,
  );

  return response;
};

export const POST = async () => {
  const { sessionId, shouldSetAnonCookie, isAuthenticated } =
    await resolveChatSession();

  if (isAuthenticated) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await insertAuthChat(supabase, user.id);

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create chat." },
        { status: 500 },
      );
    }

    const response = NextResponse.json({ data });

    await applyAnonSessionCookieIfNeeded(
      response,
      sessionId,
      shouldSetAnonCookie,
    );

    return response;
  }

  const response = NextResponse.json({
    data: chatStore.createChat(sessionId),
  });

  await applyAnonSessionCookieIfNeeded(
    response,
    sessionId,
    shouldSetAnonCookie,
  );

  return response;
};
