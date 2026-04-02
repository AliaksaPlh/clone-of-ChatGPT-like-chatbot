import { Pill } from "@/components/ui/pill";
import { type ChatMessage } from "@/types/chat";

type MessageHeaderProps = {
  message: ChatMessage;
};

const formatTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getRoleLabel = (role: ChatMessage["role"]) => {
  if (role === "assistant") {
    return "Assistant";
  }

  if (role === "system") {
    return "System";
  }

  return "You";
};

export const MessageHeader = ({ message }: MessageHeaderProps) => {
  return (
    <div className="flex items-center gap-2">
      <p className="text-sm font-semibold text-zinc-950">
        {getRoleLabel(message.role)}
      </p>
      <span className="text-xs text-zinc-400">{formatTime(message.createdAt)}</span>
      {message.status === "streaming" ? (
        <Pill className="px-2 py-0.5 text-[10px] font-semibold" tone="success">
          streaming
        </Pill>
      ) : null}
    </div>
  );
};
