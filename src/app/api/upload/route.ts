import { NextResponse } from "next/server";

import { chatStore } from "@/lib/chat-store";
import {
  applyAnonSessionCookieIfNeeded,
  resolveChatSession,
} from "@/lib/resolve-chat-session";
import { createClient } from "@/lib/supabase/server";
import {
  authUserOwnsChat,
  insertAuthChat,
  insertAuthUserMessage,
} from "@/lib/supabase/persisted-chats";
import { type ChatAttachmentType } from "@/types/chat";

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const extractTextPreview = async (file: File) => {
  if (!file.type.includes("text") && file.type !== "application/pdf") {
    return undefined;
  }

  const text = await file.text();

  return text.replace(/\s+/g, " ").trim().slice(0, 400);
};

const buildUploadMessageContent = (
  attachments: Array<{
    name: string;
    sizeLabel: string;
    textPreview?: string;
  }>,
) => {
  const count = attachments.length;
  const list = attachments
    .map((a) => `${a.name} (${a.sizeLabel})`)
    .join(", ");
  const head =
    count === 1
      ? `Uploaded 1 file for chat context: ${list}.`
      : `Uploaded ${count} files for chat context: ${list}.`;

  const previews = attachments
    .filter((a) => a.textPreview)
    .map((a) => `${a.name}: ${a.textPreview}`);

  if (!previews.length) {
    return head;
  }

  return `${head}\n\n${previews.join("\n\n")}`;
};

export const POST = async (request: Request) => {
  const { sessionId, shouldSetAnonCookie, isAuthenticated } =
    await resolveChatSession();
  const formData = await request.formData();
  const requestedChatId = formData.get("chatId");
  const files = formData.getAll("files");

  const normalizedFiles = files.filter((item): item is File => item instanceof File);

  if (!normalizedFiles.length) {
    return NextResponse.json(
      { error: "At least one file is required." },
      { status: 400 },
    );
  }

  const attachmentMeta = await Promise.all(
    normalizedFiles.map(async (file) => {
      const type: ChatAttachmentType = file.type.startsWith("image/")
        ? "image"
        : "document";

      return {
        id: crypto.randomUUID(),
        name: file.name,
        type,
        sizeLabel: formatFileSize(file.size),
        mimeType: file.type,
        textPreview: await extractTextPreview(file),
      };
    }),
  );

  if (isAuthenticated) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let chatId: string;

    if (
      typeof requestedChatId === "string" &&
      (await authUserOwnsChat(supabase, requestedChatId))
    ) {
      chatId = requestedChatId;
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

      chatId = thread.id;
    }

    const content = buildUploadMessageContent(attachmentMeta);
    const { data: userMessage, error: msgErr } = await insertAuthUserMessage(
      supabase,
      chatId,
      content,
    );

    if (msgErr || !userMessage) {
      return NextResponse.json(
        { error: msgErr?.message ?? "Failed to save upload message." },
        { status: 500 },
      );
    }

    const createdAt = userMessage.createdAt;
    const attachments = attachmentMeta.map((a) => ({
      ...a,
      chatId,
      createdAt,
    }));

    const response = NextResponse.json({
      data: { attachments, chatId },
    });

    await applyAnonSessionCookieIfNeeded(
      response,
      sessionId,
      shouldSetAnonCookie,
    );

    return response;
  }

  const chatId =
    typeof requestedChatId === "string" &&
    chatStore.hasChat(sessionId, requestedChatId)
      ? requestedChatId
      : chatStore.createChat(sessionId).id;

  const response = NextResponse.json({
    data: {
      attachments: chatStore.addAttachments(sessionId, chatId, attachmentMeta),
    },
  });

  await applyAnonSessionCookieIfNeeded(
    response,
    sessionId,
    shouldSetAnonCookie,
  );

  return response;
};
