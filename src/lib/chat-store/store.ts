import { FREE_PROMPT_LIMIT } from "@/lib/chat-store/constants";
import { createId, formatRelativeTime, nowIso } from "@/lib/chat-store/id-time";
import { ensureStore } from "@/lib/chat-store/memory";
import { isAuthChatSessionId } from "@/lib/chat-store/session-key";
import { buildTitleFromContent } from "@/lib/chat-store/title";
import {
  type ChatAttachment,
  type ChatMessage,
  type ChatThread,
  type UserSession,
} from "@/types/chat";

import { buildAssistantResponse } from "@/lib/chat-store/assistant-response";

export const chatStore = {
  getSession(sessionId: string): UserSession {
    const store = ensureStore(sessionId);
    const session = store.sessions.get(sessionId) ?? { usedFreePrompts: 0 };

    if (isAuthChatSessionId(sessionId)) {
      return {
        id: sessionId,
        isAnonymous: false,
        usedFreePrompts: session.usedFreePrompts,
        remainingFreePrompts: 1_000_000,
      };
    }

    const remainingFreePrompts = Math.max(
      0,
      FREE_PROMPT_LIMIT - session.usedFreePrompts,
    );

    return {
      id: sessionId,
      isAnonymous: true,
      usedFreePrompts: session.usedFreePrompts,
      remainingFreePrompts,
    };
  },

  getChats(sessionId: string): Array<ChatThread> {
    const store = ensureStore(sessionId);
    const chats = store.chatsBySession.get(sessionId) ?? [];

    return chats
      .slice()
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime(),
      )
      .map((chat) => ({
        ...chat,
        updatedAt: formatRelativeTime(chat.updatedAt),
      }));
  },

  hasChat(sessionId: string, chatId: string) {
    const store = ensureStore(sessionId);
    const chats = store.chatsBySession.get(sessionId) ?? [];

    return chats.some((chat) => chat.id === chatId);
  },

  getMessages(sessionId: string, chatId: string): Array<ChatMessage> {
    if (!chatStore.hasChat(sessionId, chatId)) {
      return [];
    }

    const store = ensureStore(sessionId);

    return (store.messagesByChatId.get(chatId) ?? []).slice();
  },

  getAttachments(sessionId: string, chatId: string): Array<ChatAttachment> {
    if (!chatStore.hasChat(sessionId, chatId)) {
      return [];
    }

    const store = ensureStore(sessionId);

    return (store.attachmentsByChatId.get(chatId) ?? []).slice();
  },

  createChat(sessionId: string): ChatThread {
    const store = ensureStore(sessionId);
    const createdAt = nowIso();
    const chat: ChatThread = {
      id: createId("chat"),
      title: "New chat",
      preview: "Start typing to begin the conversation.",
      createdAt,
      updatedAt: createdAt,
    };

    const chats = store.chatsBySession.get(sessionId) ?? [];
    store.chatsBySession.set(sessionId, [chat, ...chats]);
    store.messagesByChatId.set(chat.id, []);
    store.attachmentsByChatId.set(chat.id, []);

    return {
      ...chat,
      updatedAt: formatRelativeTime(chat.updatedAt),
    };
  },

  canSendPrompt(sessionId: string) {
    if (isAuthChatSessionId(sessionId)) {
      return true;
    }

    const session = chatStore.getSession(sessionId);

    return session.remainingFreePrompts > 0;
  },

  recordUserPrompt(
    sessionId: string,
    chatId: string,
    content: string,
  ): ChatMessage {
    const store = ensureStore(sessionId);
    const chats = store.chatsBySession.get(sessionId) ?? [];
    const chatIndex = chats.findIndex((chat) => chat.id === chatId);
    const createdAt = nowIso();
    const message: ChatMessage = {
      id: createId("message"),
      chatId,
      role: "user",
      content,
      createdAt,
      status: "sent",
    };

    const existingMessages = store.messagesByChatId.get(chatId) ?? [];
    store.messagesByChatId.set(chatId, [...existingMessages, message]);

    if (chatIndex >= 0) {
      const current = chats[chatIndex];
      chats[chatIndex] = {
        ...current,
        title:
          current.title === "New chat"
            ? buildTitleFromContent(content)
            : current.title,
        preview: content,
        updatedAt: createdAt,
      };
      store.chatsBySession.set(sessionId, chats);
    }

    if (!isAuthChatSessionId(sessionId)) {
      const session = store.sessions.get(sessionId) ?? { usedFreePrompts: 0 };
      store.sessions.set(sessionId, {
        usedFreePrompts: session.usedFreePrompts + 1,
      });
    }

    return message;
  },

  addAttachments(
    sessionId: string,
    chatId: string,
    attachments: Array<Omit<ChatAttachment, "chatId" | "createdAt">>,
  ) {
    const store = ensureStore(sessionId);
    const createdAt = nowIso();
    const existingAttachments = store.attachmentsByChatId.get(chatId) ?? [];
    const normalizedAttachments: Array<ChatAttachment> = attachments.map(
      (attachment) => ({
        ...attachment,
        chatId,
        createdAt,
      }),
    );

    store.attachmentsByChatId.set(chatId, [
      ...existingAttachments,
      ...normalizedAttachments,
    ]);

    const uploadMessage: ChatMessage = {
      id: createId("message"),
      chatId,
      role: "user",
      content:
        normalizedAttachments.length === 1
          ? "Uploaded 1 file for chat context."
          : `Uploaded ${normalizedAttachments.length} files for chat context.`,
      createdAt,
      status: "sent",
      attachments: normalizedAttachments,
    };
    const existingMessages = store.messagesByChatId.get(chatId) ?? [];

    store.messagesByChatId.set(chatId, [...existingMessages, uploadMessage]);

    const chats = store.chatsBySession.get(sessionId) ?? [];
    const chatIndex = chats.findIndex((chat) => chat.id === chatId);

    if (chatIndex >= 0) {
      const current = chats[chatIndex];
      chats[chatIndex] = {
        ...current,
        preview: uploadMessage.content,
        updatedAt: createdAt,
      };
      store.chatsBySession.set(sessionId, chats);
    }

    return normalizedAttachments;
  },

  recordAssistantMessage(
    sessionId: string,
    chatId: string,
    content: string,
  ): ChatMessage {
    const store = ensureStore(sessionId);
    const createdAt = nowIso();
    const message: ChatMessage = {
      id: createId("message"),
      chatId,
      role: "assistant",
      content,
      createdAt,
      status: "sent",
    };

    const existingMessages = store.messagesByChatId.get(chatId) ?? [];
    store.messagesByChatId.set(chatId, [...existingMessages, message]);

    const chats = store.chatsBySession.get(sessionId) ?? [];
    const chatIndex = chats.findIndex((chat) => chat.id === chatId);

    if (chatIndex >= 0) {
      const current = chats[chatIndex];
      chats[chatIndex] = {
        ...current,
        preview: content,
        updatedAt: createdAt,
      };
      store.chatsBySession.set(sessionId, chats);
    }

    return message;
  },

  buildAssistantResponse,
};
