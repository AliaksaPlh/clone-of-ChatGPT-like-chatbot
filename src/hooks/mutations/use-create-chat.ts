"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { publishChatSync } from "@/lib/chat-sync";
import { queryKeys } from "@/lib/query-keys";
import { chatApi } from "@/services/chat-api";

export const useCreateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.createChat,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
      publishChatSync({ type: "chats-updated" });
    },
  });
};
