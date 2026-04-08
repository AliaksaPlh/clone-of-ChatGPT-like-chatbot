import { NextResponse } from "next/server";

import { chatStore } from "@/lib/chat-store";
import {
  applyAnonSessionCookieIfNeeded,
  resolveChatSession,
} from "@/lib/resolve-chat-session";
import { createClient } from "@/lib/supabase/server";
import {
  authUserOwnsChat,
  fetchAuthMessages,
} from "@/lib/supabase/persisted-chats";

export const GET = async (request: Request) => {
  const { sessionId, shouldSetAnonCookie, isAuthenticated } =
    await resolveChatSession();
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return NextResponse.json(
      {
        error: "chatId is required.",
      },
      { status: 400 },
    );
  }

  if (isAuthenticated) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const owns = await authUserOwnsChat(supabase, chatId);

    if (!owns) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await fetchAuthMessages(supabase, chatId);

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
    data: chatStore.getMessages(sessionId, chatId),
  });

  await applyAnonSessionCookieIfNeeded(
    response,
    sessionId,
    shouldSetAnonCookie,
  );

  return response;
};
