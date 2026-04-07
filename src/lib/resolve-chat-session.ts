import {
  authChatSessionId,
  isAuthChatSessionId,
} from "@/lib/chat-store/session-key";
import { applySessionCookie, getOrCreateSessionId } from "@/lib/server-session";
import { createClient } from "@/lib/supabase/server";

export type ResolvedChatSession = {
  sessionId: string;
  /** if anonymous users set `chatbot-anon-id` on 1 visit */
  shouldSetAnonCookie: boolean;
  isAuthenticated: boolean;
};

/**
 * use Supabase `getUser()` when configured, otherwise anonymous cookie session
 * authed users get `sessionId` from Supabase user id
 */
export const resolveChatSession = async (): Promise<ResolvedChatSession> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      return {
        sessionId: authChatSessionId(user.id),
        shouldSetAnonCookie: false,
        isAuthenticated: true,
      };
    }
  } catch {
    console.log(
      "Failed to get user from Supabase, falling back to anonymous session",
    );
  }

  const { sessionId, shouldSetCookie } = await getOrCreateSessionId();

  return {
    sessionId,
    shouldSetAnonCookie: shouldSetCookie,
    isAuthenticated: false,
  };
};

export const applyAnonSessionCookieIfNeeded = async (
  response: Response,
  sessionId: string,
  shouldSetAnonCookie: boolean,
) => {
  if (!shouldSetAnonCookie) {
    return;
  }

  if (isAuthChatSessionId(sessionId)) {
    return;
  }

  await applySessionCookie(response, sessionId);
};
