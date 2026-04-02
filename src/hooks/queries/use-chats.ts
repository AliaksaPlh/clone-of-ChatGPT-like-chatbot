"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { chatApi } from "@/services/chat-api";

export const useChats = () =>
  useQuery({
    queryKey: queryKeys.chats,
    queryFn: chatApi.getChats,
  });
