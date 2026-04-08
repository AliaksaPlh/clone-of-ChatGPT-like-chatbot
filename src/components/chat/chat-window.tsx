import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import {
  type ChatMessage,
  type ChatThread,
  type UserSession,
} from "@/types/chat";

import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";

type ChatWindowProps = {
  currentChat?: ChatThread;
  isMessagesLoading: boolean;
  isStreaming: boolean;
  isUploading: boolean;
  messages: Array<ChatMessage>;
  notice?: string;
  session?: UserSession;
  onUploadFiles: (files: Array<File>) => Promise<void>;
  onSendMessage: (content: string) => Promise<void>;
};

export const ChatWindow = ({
  currentChat,
  isMessagesLoading,
  isStreaming,
  isUploading,
  messages,
  notice,
  session,
  onUploadFiles,
  onSendMessage,
}: ChatWindowProps) => {
  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#f7f7f8]">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-[#f7f7f8]/90 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              aria-label="Open sidebar"
              className="border border-black/10 bg-white text-zinc-700 lg:hidden"
              size="icon"
              variant="ghost"
            >
              <Menu className="size-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-zinc-950">
                  {currentChat?.title ?? "New chat"}
                </p>
                <Pill
                  className="px-2 py-1 text-[10px] font-semibold"
                  tone="success"
                >
                  live
                </Pill>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <MessageList isLoading={isMessagesLoading} messages={messages} />
          {notice ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {notice}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-black/5 px-4 py-4 md:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <ChatInput
            chatId={currentChat?.id}
            isStreaming={isStreaming}
            isUnlimitedPrompts={Boolean(session && !session.isAnonymous)}
            isUploading={isUploading}
            onUploadFiles={onUploadFiles}
            onSendMessage={onSendMessage}
            remainingFreePrompts={session?.remainingFreePrompts ?? 0}
          />
        </div>
      </div>
    </section>
  );
};
