import { NextResponse } from "next/server";

import { chatStore } from "@/lib/chat-store";
import {
  applyAnonSessionCookieIfNeeded,
  resolveChatSession,
} from "@/lib/resolve-chat-session";

export const GET = async () => {
  const { sessionId, shouldSetAnonCookie } = await resolveChatSession();
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
  const { sessionId, shouldSetAnonCookie } = await resolveChatSession();
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
