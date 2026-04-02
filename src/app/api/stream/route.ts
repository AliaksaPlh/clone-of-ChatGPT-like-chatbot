import { NextResponse } from "next/server";

import { chatStore } from "@/lib/chat-store";
import { applySessionCookie, getOrCreateSessionId } from "@/lib/server-session";

type StreamBody = {
  chatId?: string;
  content?: string;
};

const encoder = new TextEncoder();

const createSseEvent = (payload: Record<string, unknown>) =>
  encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);

export const POST = async (request: Request) => {
  const body = (await request.json()) as StreamBody;
  const content = body.content?.trim();

  if (!content) {
    return NextResponse.json(
      {
        error: "Message content is required.",
      },
      { status: 400 },
    );
  }

  const { sessionId, shouldSetCookie } = await getOrCreateSessionId();

  if (!chatStore.canSendPrompt(sessionId)) {
    return NextResponse.json(
      {
        error: "Free anonymous prompt limit reached.",
      },
      { status: 403 },
    );
  }

  const chat =
    body.chatId && chatStore.hasChat(sessionId, body.chatId)
      ? body.chatId
      : chatStore.createChat(sessionId).id;

  const userMessage = chatStore.recordUserPrompt(sessionId, chat, content);
  const assistantText = chatStore.buildAssistantResponse(
    content,
    chatStore.getAttachments(sessionId, chat),
  );
  const tokens = assistantText.split(" ");

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        createSseEvent({
          type: "metadata",
          chatId: chat,
          userMessage,
        }),
      );

      let accumulated = "";

      for (const token of tokens) {
        accumulated = accumulated ? `${accumulated} ${token}` : token;
        controller.enqueue(
          createSseEvent({
            type: "delta",
            delta: `${token} `,
          }),
        );
        await new Promise((resolve) => setTimeout(resolve, 35));
      }

      const assistantMessage = chatStore.recordAssistantMessage(
        sessionId,
        chat,
        accumulated.trim(),
      );

      controller.enqueue(
        createSseEvent({
          type: "done",
          chatId: chat,
          assistantMessage,
          session: chatStore.getSession(sessionId),
        }),
      );

      controller.close();
    },
  });

  const response = new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });

  if (shouldSetCookie) {
    await applySessionCookie(response, sessionId);
  }

  return response;
};
