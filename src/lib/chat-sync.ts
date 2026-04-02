"use client";

const CHANNEL_NAME = "chatbot-sync";
const STORAGE_KEY = "chatbot-sync";

type ChatSyncEvent =
  | { type: "chats-updated" }
  | { type: "messages-updated"; chatId: string }
  | { type: "session-updated" };

let broadcastChannel: BroadcastChannel | null = null;

const getChannel = () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }

  return broadcastChannel;
};

export const publishChatSync = (event: ChatSyncEvent) => {
  const channel = getChannel();

  channel?.postMessage(event);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...event,
    timestamp: Date.now(),
  }));
};

export const subscribeChatSync = (handler: (event: ChatSyncEvent) => void) => {
  const channel = getChannel();

  const handleMessage = (event: MessageEvent<ChatSyncEvent>) => {
    handler(event.data);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) {
      return;
    }

    handler(JSON.parse(event.newValue) as ChatSyncEvent);
  };

  channel?.addEventListener("message", handleMessage);
  window.addEventListener("storage", handleStorage);

  return () => {
    channel?.removeEventListener("message", handleMessage);
    window.removeEventListener("storage", handleStorage);
  };
};
