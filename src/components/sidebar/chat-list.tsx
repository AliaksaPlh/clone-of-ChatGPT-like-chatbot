import { type ChatThread } from "@/types/chat";

import { CounterBadge } from "@/components/ui/counter-badge";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";

type ChatListProps = {
  threads: Array<ChatThread>;
  activeChatId: string;
  onSelectChat: (chatId: string) => void;
};

export const ChatList = ({
  threads,
  activeChatId,
  onSelectChat,
}: ChatListProps) => {
  return (
    <div className="space-y-2">
      {threads.map((thread) => {
        const isActive = thread.id === activeChatId;

        return (
          <button
            key={thread.id}
            type="button"
            onClick={() => onSelectChat(thread.id)}
            className={cn(
              "w-full rounded-2xl border px-4 py-3 text-left transition",
              isActive
                ? "border-white/15 bg-white/10"
                : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/5",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-white">
                    {thread.title}
                  </p>
                  {thread.isPinned ? (
                    <Pill className="px-2 py-0.5 text-[10px] font-medium" tone="success-dark">
                      Pinned
                    </Pill>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/55">
                  {thread.preview}
                </p>
              </div>
              <div className="shrink-0 text-[11px] text-white/40">
                {thread.updatedAt}
              </div>
            </div>

            {thread.unreadCount ? (
              <div className="mt-3 flex justify-end">
                <CounterBadge value={thread.unreadCount} />
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};
