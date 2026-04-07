import { NextResponse } from "next/server";

import { chatStore } from "@/lib/chat-store";
import {
  applyAnonSessionCookieIfNeeded,
  resolveChatSession,
} from "@/lib/resolve-chat-session";

export const GET = async (request: Request) => {
  const { sessionId, shouldSetAnonCookie } = await resolveChatSession();
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
