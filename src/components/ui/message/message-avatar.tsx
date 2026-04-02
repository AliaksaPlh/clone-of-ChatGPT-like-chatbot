import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { type ChatRole } from "@/types/chat";

type MessageAvatarProps = {
  role: ChatRole;
};

export const MessageAvatar = ({ role }: MessageAvatarProps) => {
  const isAssistant = role === "assistant";
  const isSystem = role === "system";

  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-2xl",
        isAssistant
          ? "bg-black text-white"
          : isSystem
            ? "bg-sky-500 text-white"
            : "bg-white text-zinc-700",
      )}
    >
      {isAssistant ? (
        <Sparkles className="size-4" />
      ) : (
        <span className="text-sm font-semibold">{isSystem ? "S" : "U"}</span>
      )}
    </div>
  );
};
