export type ChatRole = "user" | "assistant" | "system";

export type ChatAttachmentType = "image" | "document";

export type ChatAttachment = {
  id: string;
  chatId: string;
  name: string;
  type: ChatAttachmentType;
  sizeLabel: string;
  mimeType?: string;
  textPreview?: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  status?: "sent" | "streaming" | "failed";
  attachments?: Array<ChatAttachment>;
};

export type ChatThread = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  createdAt: string;
  unreadCount?: number;
  isPinned?: boolean;
};

export type UserSession = {
  id: string;
  isAnonymous: boolean;
  remainingFreePrompts: number;
  usedFreePrompts: number;
};

export type ChatsResponse = {
  data: Array<ChatThread>;
};

export type MessagesResponse = {
  data: Array<ChatMessage>;
};

export type UploadResponse = {
  data: {
    attachments: Array<ChatAttachment>;
    /** Present when the server created or bound uploads to a different chat (e.g. Postgres path). */
    chatId?: string;
  };
};
