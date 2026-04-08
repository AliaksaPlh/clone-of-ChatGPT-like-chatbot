import { type SupabaseClient } from "@supabase/supabase-js";
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
  getAuthChatTitle,
  insertAuthAssistantMessage,
  insertAuthChat,
  insertAuthUserMessage,
  maybeUpdateAuthChatTitleFromUserMessage,
} from "@/lib/supabase/persisted-chats";
import { buildResponseInputFromMessages } from "@/llm/build-response-input";
import { getOpenAIModel } from "@/llm/config";
import { createOpenAIClient, isOpenAIConfigured } from "@/llm/openai-client";
import { processOpenAIResponseStream } from "@/llm/process-response-stream";
import { type ChatMessage } from "@/types/chat";

type StreamBody = {
  chatId?: string;
  content?: string;
};

const encoder = new TextEncoder();

const createSseEvent = (payload: Record<string, unknown>) =>
  encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);

const persistAssistantMessage = async (
  sessionId: string,
  chatId: string,
  text: string,
  supabase: SupabaseClient | null,
): Promise<{ message: ChatMessage | null; error: string | null }> => {
  const trimmed = text.trim();

  if (supabase) {
    const { data, error } = await insertAuthAssistantMessage(
      supabase,
      chatId,
      trimmed,
    );

    if (error || !data) {
      return {
        message: null,
        error: error?.message ?? "Failed to save assistant message.",
      };
    }

    return { message: data, error: null };
  }

  return {
    message: chatStore.recordAssistantMessage(sessionId, chatId, trimmed),
    error: null,
  };
};

const streamMockAssistant = async (
  controller: ReadableStreamDefaultController<Uint8Array>,
  sessionId: string,
  chat: string,
  content: string,
  userMessage: ChatMessage,
  supabase: SupabaseClient | null,
) => {
  const attachments = supabase
    ? []
    : chatStore.getAttachments(sessionId, chat);
  const assistantText = chatStore.buildAssistantResponse(content, attachments);
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

  const { message: assistantMessage, error } = await persistAssistantMessage(
    sessionId,
    chat,
    accumulated,
    supabase,
  );

  if (error || !assistantMessage) {
    controller.enqueue(
      createSseEvent({
        type: "error",
        error: error ?? "Failed to save assistant message.",
      }),
    );
    return;
  }

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

  const { sessionId, shouldSetAnonCookie, isAuthenticated } =
    await resolveChatSession();

  let chat: string;
  let userMessage: ChatMessage;
  let messages: Array<ChatMessage>;
  let supabase: SupabaseClient | null = null;

  if (isAuthenticated) {
    const client = await createClient();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    supabase = client;

    if (
      body.chatId &&
      (await authUserOwnsChat(supabase, body.chatId))
    ) {
      chat = body.chatId;
    } else {
      const { data: thread, error: chatErr } = await insertAuthChat(
        supabase,
        user.id,
      );

      if (chatErr || !thread) {
        return NextResponse.json(
          { error: chatErr?.message ?? "Failed to create chat." },
          { status: 500 },
        );
      }

      chat = thread.id;
    }

    const chatTitle =
      (await getAuthChatTitle(supabase, chat)) ?? "New chat";

    const { data: insertedUser, error: userMsgErr } =
      await insertAuthUserMessage(supabase, chat, content);

    if (userMsgErr || !insertedUser) {
      return NextResponse.json(
        { error: userMsgErr?.message ?? "Failed to save message." },
        { status: 500 },
      );
    }

    userMessage = insertedUser;

    await maybeUpdateAuthChatTitleFromUserMessage(
      supabase,
      chat,
      chatTitle,
      content,
    );

    const { data: authMessages, error: loadErr } = await fetchAuthMessages(
      supabase,
      chat,
    );

    if (loadErr) {
      return NextResponse.json(
        { error: loadErr.message },
        { status: 500 },
      );
    }

    messages = authMessages;
  } else {
    if (!chatStore.canSendPrompt(sessionId)) {
      return NextResponse.json(
        {
          error: "Free anonymous prompt limit reached.",
        },
        { status: 403 },
      );
    }

    chat =
      body.chatId && chatStore.hasChat(sessionId, body.chatId)
        ? body.chatId
        : chatStore.createChat(sessionId).id;

    userMessage = chatStore.recordUserPrompt(sessionId, chat, content);
    messages = chatStore.getMessages(sessionId, chat);
  }

  const stream = new ReadableStream({
    async start(controller) {
      if (!isOpenAIConfigured()) {
        await streamMockAssistant(
          controller,
          sessionId,
          chat,
          content,
          userMessage,
          supabase,
        );
        controller.close();
        return;
      }

      const openAiClient = createOpenAIClient();

      if (!openAiClient) {
        await streamMockAssistant(
          controller,
          sessionId,
          chat,
          content,
          userMessage,
          supabase,
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

        const openaiStream = await openAiClient.responses.create({
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
        const { message: assistantMessage, error: persistErr } =
          await persistAssistantMessage(
            sessionId,
            chat,
            finalText,
            supabase,
          );

        if (persistErr || !assistantMessage) {
          controller.enqueue(
            createSseEvent({
              type: "error",
              error: persistErr ?? "Failed to save assistant message.",
            }),
          );
          controller.close();
          return;
        }

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
