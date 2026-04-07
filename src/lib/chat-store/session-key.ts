/** define chat-store session ids. for guests random UUID, for signed-in users use `auth:` + Supabase user id to skip the limit*/
export const AUTH_CHAT_SESSION_PREFIX = "auth:" as const;

export const isAuthChatSessionId = (sessionId: string) =>
  sessionId.startsWith(AUTH_CHAT_SESSION_PREFIX);

export const authChatSessionId = (supabaseUserId: string) =>
  `${AUTH_CHAT_SESSION_PREFIX}${supabaseUserId}`;
