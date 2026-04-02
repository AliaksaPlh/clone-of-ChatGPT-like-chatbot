import { NextResponse } from "next/server";

import { chatStore } from "@/lib/chat-store";
import { applySessionCookie, getOrCreateSessionId } from "@/lib/server-session";

export const GET = async () => {
  const { sessionId, shouldSetCookie } = await getOrCreateSessionId();
  const response = NextResponse.json({
    data: chatStore.getSession(sessionId),
  });

  if (shouldSetCookie) {
    await applySessionCookie(response, sessionId);
  }

  return response;
};
