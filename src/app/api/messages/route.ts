import { NextResponse } from "next/server";

import { chatStore } from "@/lib/chat-store";
import { applySessionCookie, getOrCreateSessionId } from "@/lib/server-session";

export const GET = async (request: Request) => {
  const { sessionId, shouldSetCookie } = await getOrCreateSessionId();
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

  if (shouldSetCookie) {
    await applySessionCookie(response, sessionId);
  }

  return response;
};
