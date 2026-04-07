import { NextResponse } from "next/server";

import { chatStore } from "@/lib/chat-store";
import {
  applyAnonSessionCookieIfNeeded,
  resolveChatSession,
} from "@/lib/resolve-chat-session";
import { buildResponseInputFromMessages } from "@/llm/build-response-input";
import { getOpenAIModel } from "@/llm/config";
import { createOpenAIClient, isOpenAIConfigured } from "@/llm/openai-client";
import { processOpenAIResponseStream } from "@/llm/process-response-stream";

type StreamBody = {
  chatId?: string;
  content?: string;
};

const encoder = new TextEncoder();

const createSseEvent = (payload: Record<string, unknown>) =>
  encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);

const streamMockAssistant = async (
  controller: ReadableStreamDefaultController<Uint8Array>,
  sessionId: string,
  chat: string,
  content: string,
  userMessage: ReturnType<typeof chatStore.recordUserPrompt>,
) => {
  const assistantText = chatStore.buildAssistantResponse(
    content,
    chatStore.getAttachments(sessionId, chat),
  );
  const tokens = assistantText.split(" ");

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
};

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

  const { sessionId, shouldSetAnonCookie } = await resolveChatSession();

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
  const messages = chatStore.getMessages(sessionId, chat);

  const stream = new ReadableStream({
    async start(controller) {
      if (!isOpenAIConfigured()) {
        await streamMockAssistant(
          controller,
          sessionId,
          chat,
          content,
          userMessage,
        );
        controller.close();
        return;
      }

      const client = createOpenAIClient();

      if (!client) {
        await streamMockAssistant(
          controller,
          sessionId,
          chat,
          content,
          userMessage,
        );
        controller.close();
        return;
      }

      controller.enqueue(
        createSseEvent({
          type: "metadata",
          chatId: chat,
          userMessage,
        }),
      );

      let accumulated = "";

      try {
        const input = buildResponseInputFromMessages(messages);

        const openaiStream = await client.responses.create({
          model: getOpenAIModel(),
          input,
          stream: true,
        });

        const { error } = await processOpenAIResponseStream(
          openaiStream,
          (delta) => {
            accumulated += delta;
            controller.enqueue(
              createSseEvent({
                type: "delta",
                delta,
              }),
            );
          },
        );

        if (error) {
          controller.enqueue(
            createSseEvent({
              type: "error",
              error,
            }),
          );
          controller.close();
          return;
        }

        const finalText = accumulated.trim() || "No response generated.";
        const assistantMessage = chatStore.recordAssistantMessage(
          sessionId,
          chat,
          finalText,
        );

        controller.enqueue(
          createSseEvent({
            type: "done",
            chatId: chat,
            assistantMessage,
            session: chatStore.getSession(sessionId),
          }),
        );
      } catch (unknownError) {
        const message =
          unknownError instanceof Error
            ? unknownError.message
            : "OpenAI request failed.";

        controller.enqueue(
          createSseEvent({
            type: "error",
            error: message,
          }),
        );
      }

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

  await applyAnonSessionCookieIfNeeded(
    response,
    sessionId,
    shouldSetAnonCookie,
  );

  return response;
};
