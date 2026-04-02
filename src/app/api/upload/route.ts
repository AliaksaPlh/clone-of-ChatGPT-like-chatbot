import { NextResponse } from "next/server";

import { chatStore } from "@/lib/chat-store";
import { applySessionCookie, getOrCreateSessionId } from "@/lib/server-session";
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

export const POST = async (request: Request) => {
  const { sessionId, shouldSetCookie } = await getOrCreateSessionId();
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

  const chatId =
    typeof requestedChatId === "string" &&
    chatStore.hasChat(sessionId, requestedChatId)
      ? requestedChatId
      : chatStore.createChat(sessionId).id;

  const attachments = await Promise.all(
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

  const response = NextResponse.json({
    data: {
      attachments: chatStore.addAttachments(sessionId, chatId, attachments),
    },
  });

  if (shouldSetCookie) {
    await applySessionCookie(response, sessionId);
  }

  return response;
};
