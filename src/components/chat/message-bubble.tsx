import { AttachmentItem } from "@/components/chat/attachment-item";
import { MessageAvatar } from "@/components/ui/message/message-avatar";
import { MessageHeader } from "@/components/ui/message/message-header";
import { cn } from "@/lib/utils";
import { type ChatMessage } from "@/types/chat";

type MessageBubbleProps = {
  message: ChatMessage;
};

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";

  return (
    <article
      className={cn(
        "flex w-full gap-4 rounded-3xl border p-4 shadow-sm backdrop-blur-sm md:p-5",
        isAssistant
          ? "border-white/10 bg-white"
          : "border-white/70 bg-[#f3f5f7]",
        isSystem ? "border-sky-200 bg-sky-50" : undefined,
      )}
    >
      <MessageAvatar role={message.role} />

      <div className="min-w-0 flex-1">
        <MessageHeader message={message} />

        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-700 md:text-[15px]">
          {message.content}
        </p>

        {message.attachments?.length ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {message.attachments.map((attachment) => (
              <AttachmentItem key={attachment.id} attachment={attachment} />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
};
