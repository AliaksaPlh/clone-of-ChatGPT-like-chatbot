import {
  type ChatAttachment,
  type ChatMessage,
  type ChatThread,
} from "@/types/chat";

export type SessionState = {
  usedFreePrompts: number;
};

export type ChatStore = {
  chatsBySession: Map<string, Array<ChatThread>>;
  messagesByChatId: Map<string, Array<ChatMessage>>;
  attachmentsByChatId: Map<string, Array<ChatAttachment>>;
  sessions: Map<string, SessionState>;
};
