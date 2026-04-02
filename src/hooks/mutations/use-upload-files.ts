"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { publishChatSync } from "@/lib/chat-sync";
import { queryKeys } from "@/lib/query-keys";
import { chatApi } from "@/services/chat-api";

type UploadFilesPayload = {
  chatId: string;
  files: Array<File>;
};

export const useUploadFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, files }: UploadFilesPayload) =>
      chatApi.uploadFiles(chatId, files),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.chats }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages(variables.chatId),
        }),
      ]);

      publishChatSync({ type: "chats-updated" });
      publishChatSync({ type: "messages-updated", chatId: variables.chatId });
    },
  });
};
