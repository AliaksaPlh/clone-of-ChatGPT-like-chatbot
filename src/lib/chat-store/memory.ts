import { type ChatThread } from "@/types/chat";

import { createId, nowIso } from "@/lib/chat-store/id-time";
import { type ChatStore } from "@/lib/chat-store/types";

const buildInitialData = (sessionId: string): ChatStore => {
  const createdAt = nowIso();
  const chatId = createId("chat");

  const initialChat: ChatThread = {
    id: chatId,
    title: "New chat",
    preview: "No messages yet.",
    createdAt,
    updatedAt: createdAt,
    isPinned: true,
  };

  return {
    chatsBySession: new Map([[sessionId, [initialChat]]]),
    messagesByChatId: new Map([[chatId, []]]),
    attachmentsByChatId: new Map([[chatId, []]]),
    sessions: new Map([[sessionId, { usedFreePrompts: 0 }]]),
  };
};

const globalStore = globalThis as typeof globalThis & {
  __chatStore?: ChatStore;
};

export const ensureStore = (sessionId: string) => {
  if (!globalStore.__chatStore) {
    globalStore.__chatStore = buildInitialData(sessionId);
  }

  const store = globalStore.__chatStore;

  if (!store.attachmentsByChatId) {
    store.attachmentsByChatId = new Map();
  }

  if (!store.chatsBySession.has(sessionId)) {
    const createdAt = nowIso();
    const chatId = createId("chat");

    store.chatsBySession.set(sessionId, [
      {
        id: chatId,
        title: "New chat",
        preview: "Start typing to see streaming responses.",
        createdAt,
        updatedAt: createdAt,
      },
    ]);

    store.messagesByChatId.set(chatId, []);
    store.attachmentsByChatId.set(chatId, []);
    store.sessions.set(sessionId, { usedFreePrompts: 0 });
  }

  if (!store.sessions.has(sessionId)) {
    store.sessions.set(sessionId, { usedFreePrompts: 0 });
  }

  const sessionChats = store.chatsBySession.get(sessionId) ?? [];

  sessionChats.forEach((chat) => {
    if (!store.messagesByChatId.has(chat.id)) {
      store.messagesByChatId.set(chat.id, []);
    }

    if (!store.attachmentsByChatId.has(chat.id)) {
      store.attachmentsByChatId.set(chat.id, []);
    }
  });

  return store;
};
