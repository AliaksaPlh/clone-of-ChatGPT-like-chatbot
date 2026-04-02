export const queryKeys = {
  chats: ["chats"] as const,
  session: ["session"] as const,
  messages: (chatId: string) => ["messages", chatId] as const,
};
