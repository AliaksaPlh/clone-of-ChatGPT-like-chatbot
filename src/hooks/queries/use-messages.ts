"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { chatApi } from "@/services/chat-api";

export const useMessages = (chatId?: string) =>
  useQuery({
    queryKey: queryKeys.messages(chatId ?? "empty"),
    queryFn: () => chatApi.getMessages(chatId ?? ""),
    enabled: Boolean(chatId),
  });
