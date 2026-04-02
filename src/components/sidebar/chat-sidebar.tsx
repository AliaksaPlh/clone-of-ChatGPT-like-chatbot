"use client";

import { Lock, MessageSquarePlus, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InfoBanner } from "@/components/ui/info-banner";
import { type ChatThread } from "@/types/chat";
import { type UserSession } from "@/types/chat";

import { ChatList } from "./chat-list";

type ChatSidebarProps = {
  threads: Array<ChatThread>;
  activeChatId: string;
  session?: UserSession;
  onCreateChat: () => void;
  onSelectChat: (chatId: string) => void;
};

export const ChatSidebar = ({
  threads,
  activeChatId,
  session,
  onCreateChat,
  onSelectChat,
}: ChatSidebarProps) => {
  return (
    <aside className="hidden h-full w-full max-w-[320px] shrink-0 border-r border-white/10 bg-[#111214] text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Chatbot</p>
            </div>
          </div>
          <Button
            aria-label="Collapse sidebar"
            className="text-white/60 hover:bg-white/10 hover:text-white"
            size="icon-sm"
            variant="ghost"
          >
            {/* <PanelLeftClose className="size-4 " /> */}
          </Button>
        </div>
        <Button
          className="mt-4 w-full rounded-2xl py-3"
          onClick={onCreateChat}
          iconLeft={<MessageSquarePlus className="size-4" />}
          variant="dark"
        >
          New chat
        </Button>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60">
          <Search className="size-4" />
          <span>Search conversations</span>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
        <ChatList
          activeChatId={activeChatId}
          onSelectChat={onSelectChat}
          threads={threads}
        />
      </div>

      <div className="border-t border-white/10 p-4">
        <InfoBanner
          action={
            <Button className="w-full rounded-xl" variant="dark">
              Log in to continue
            </Button>
          }
          className="border-amber-400/20 bg-amber-400/10 text-amber-100"
          description={
            <span className="text-amber-50/70">
              {session
                ? `${session.usedFreePrompts} of 3 free prompts used.`
                : "3 free prompts available."}{" "}
              Sign in to save chats, upload files and sync across tabs.
            </span>
          }
          icon={<Lock className="size-4" />}
          title="Anonymous access"
        />
      </div>
    </aside>
  );
};
