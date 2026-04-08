"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ChatWindow } from "@/components/chat/chat-window";
import { ChatSidebar } from "@/components/sidebar/chat-sidebar";
import { useCreateChat } from "@/hooks/mutations/use-create-chat";
import { useUploadFiles } from "@/hooks/mutations/use-upload-files";
import { useChatStream } from "@/hooks/use-chat-stream";
import { useChats } from "@/hooks/queries/use-chats";
import { useMessages } from "@/hooks/queries/use-messages";
import { useUser } from "@/hooks/queries/use-user";
import { subscribeChatSync } from "@/lib/chat-sync";
import { queryKeys } from "@/lib/query-keys";
import { type ChatMessage } from "@/types/chat";

const ACTIVE_CHAT_STORAGE_KEY = "chatbot-active-chat-id";

export const AppShell = () => {
  const queryClient = useQueryClient();
  const [activeChatId, setActiveChatId] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY) ?? "";
  });
  const chatsQuery = useChats();
  const userQuery = useUser();
  const createChatMutation = useCreateChat();
  const uploadFilesMutation = useUploadFiles();
  const { draftState, error, isStreaming, startStream } = useChatStream();

  const threads = useMemo(() => chatsQuery.data?.data ?? [], [chatsQuery.data?.data]);
  const resolvedActiveChatId = useMemo(() => {
    if (activeChatId && threads.some((thread) => thread.id === activeChatId)) {
      return activeChatId;
    }

    return threads[0]?.id ?? "";
  }, [activeChatId, threads]);

  useEffect(() => {
    if (!resolvedActiveChatId) {
      return;
    }

    window.localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, resolvedActiveChatId);
  }, [resolvedActiveChatId]);

  useEffect(() => {
    return subscribeChatSync((event) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });

      if (event.type === "messages-updated") {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.messages(event.chatId),
        });
      }
    });
  }, [queryClient]);

  const currentChat = useMemo(
    () => threads.find((thread) => thread.id === resolvedActiveChatId) ?? threads[0],
    [resolvedActiveChatId, threads],
  );

  const messagesQuery = useMessages(currentChat?.id);
  const visibleMessages = useMemo(() => {
    const baseMessages = messagesQuery.data?.data ?? [];

    if (!draftState?.chatId || draftState.chatId !== currentChat?.id) {
      return baseMessages;
    }

    const nextMessages: Array<ChatMessage> = [...baseMessages];

    if (
      draftState.userMessage &&
      !baseMessages.some((message) => message.id === draftState.userMessage?.id)
    ) {
      nextMessages.push(draftState.userMessage);
    }

    if (draftState.assistantText) {
      nextMessages.push({
        id: "streaming-draft",
        chatId: draftState.chatId,
        role: "assistant",
        content: draftState.assistantText.trim(),
        createdAt: new Date().toISOString(),
        status: "streaming",
      });
    }

    return nextMessages;
  }, [currentChat?.id, draftState, messagesQuery.data?.data]);

  const handleCreateChat = async () => {
    const result = await createChatMutation.mutateAsync();
    setActiveChatId(result.data.id);
  };

  const handleSendMessage = async (content: string) => {
    const result = await startStream({
      chatId: currentChat?.id,
      content,
    });

    if (result.chatId) {
      setActiveChatId(result.chatId);
    }
  };

  const handleUploadFiles = async (files: Array<File>) => {
    if (!currentChat?.id) {
      return;
    }

    const previousChatId = currentChat.id;
    const result = await uploadFilesMutation.mutateAsync({
      chatId: previousChatId,
      files,
    });

    const resolvedChatId = result.data.chatId;

    if (resolvedChatId && resolvedChatId !== previousChatId) {
      setActiveChatId(resolvedChatId);
    }
  };

  return (
    <div className="flex h-screen bg-[#f7f7f8] text-zinc-950">
      <ChatSidebar
        activeChatId={currentChat?.id ?? ""}
        onCreateChat={handleCreateChat}
        onSelectChat={setActiveChatId}
        session={userQuery.data?.data}
        threads={threads}
      />
      <ChatWindow
        currentChat={currentChat}
        isMessagesLoading={messagesQuery.isLoading}
        isStreaming={isStreaming}
        isUploading={uploadFilesMutation.isPending}
        messages={visibleMessages}
        notice={
          error instanceof Error
            ? error.message
            : uploadFilesMutation.error instanceof Error
              ? uploadFilesMutation.error.message
              : undefined
        }
        onSendMessage={handleSendMessage}
        onUploadFiles={handleUploadFiles}
        session={userQuery.data?.data}
      />
    </div>
  );
};
