import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "chatbot-anon-id";

export const getOrCreateSessionId = async () => {
  const cookieStore = await cookies();
  const current = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (current) {
    return {
      sessionId: current,
      shouldSetCookie: false,
    };
  }

  return {
    sessionId: crypto.randomUUID(),
    shouldSetCookie: true,
  };
};

export const applySessionCookie = async (response: Response, sessionId: string) => {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
};
