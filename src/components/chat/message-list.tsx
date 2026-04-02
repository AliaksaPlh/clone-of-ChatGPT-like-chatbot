import { type ChatMessage } from "@/types/chat";

import { MessageBubble } from "./message-bubble";

type MessageListProps = {
  messages: Array<ChatMessage>;
  isLoading?: boolean;
};

export const MessageList = ({ messages, isLoading }: MessageListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-3xl border border-black/5 bg-white/70"
          />
        ))}
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="rounded-[32px] border border-dashed border-black/10 bg-white/70 p-10 text-center">
        <p className="text-lg font-semibold text-zinc-950">No messages yet</p>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Start the conversation to see streamed assistant responses appear
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
};
