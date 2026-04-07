import type { ResponseInput } from "openai/resources/responses/responses";

import { type ChatMessage } from "@/types/chat";

const formatAttachmentContext = (message: ChatMessage) => {
  if (!message.attachments?.length) {
    return "";
  }

  const lines = message.attachments.map((attachment) => {
    const preview = attachment.textPreview?.trim();

    return preview
      ? `- ${attachment.name} (${attachment.type}): ${preview.slice(0, 2000)}`
      : `- ${attachment.name} (${attachment.type})`;
  });

  return `\n\n[Uploaded files for this message]\n${lines.join("\n")}`;
};

const messageToUserContent = (message: ChatMessage) => {
  const base = message.content.trim();
  const attachmentBlock = formatAttachmentContext(message);

  if (!base && !attachmentBlock) {
    return "(empty message)";
  }

  return `${base || "(no text)"}${attachmentBlock}`;
};

/**
 * map saved chat messages to the Responses API `input` list chronological
 */
export const buildResponseInputFromMessages = (
  messages: Array<ChatMessage>,
): ResponseInput => {
  const items: ResponseInput = [];

  for (const message of messages) {
    if (message.role === "assistant") {
      const text = message.content.trim();

      if (!text) {
        continue;
      }

      items.push({
        role: "assistant",
        content: text,
      });
      continue;
    }

    if (message.role === "user") {
      items.push({
        role: "user",
        content: messageToUserContent(message),
      });
    }
  }

  return items;
};
