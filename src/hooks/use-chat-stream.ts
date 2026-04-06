"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { publishChatSync } from "@/lib/chat-sync";
import { queryKeys } from "@/lib/query-keys";
import { type ChatMessage, type UserSession } from "@/types/chat";

type StreamPayload = {
  chatId?: string;
  content: string;
};

type StreamState = {
  chatId?: string;
  userMessage?: ChatMessage;
  assistantText: string;
  assistantMessage?: ChatMessage;
  session?: UserSession;
};

const parseSsePayloads = (buffer: string) => {
  const chunks = buffer.split("\n\n");
  const complete = chunks.slice(0, -1);
  const remainder = chunks.at(-1) ?? "";

  const payloads = complete
    .map((chunk) => chunk.replace(/^data:\s*/, "").trim())
    .filter(Boolean)
    .map((chunk) => JSON.parse(chunk) as Record<string, unknown>);

  return { payloads, remainder };
};

const buildStreamError = async (response: Response) => {
  try {
    const payload = (await response.json()) as { error?: string };

    if (payload.error) {
      return new Error(payload.error);
    }
  } catch {
    return new Error(`Stream request failed with status ${response.status}.`);
  }

  return new Error(`Stream request failed with status ${response.status}.`);
};

export const useChatStream = () => {
  const queryClient = useQueryClient();
  const [draftState, setDraftState] = useState<StreamState | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ chatId, content }: StreamPayload) => {
      const response = await fetch("/api/stream", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId, content }),
      });

      if (!response.ok) {
        throw await buildStreamError(response);
      }

      if (!response.body) {
        throw new Error("Stream response body is empty.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const state: StreamState = {
        assistantText: "",
      };
      let buffer = "";

      setDraftState({
        assistantText: "",
      });

      while (true) {
        const result = await reader.read();

        if (result.done) {
          break;
        }

        buffer += decoder.decode(result.value, { stream: true });
        const { payloads, remainder } = parseSsePayloads(buffer);
        buffer = remainder;

        payloads.forEach((payload) => {
          if (payload.type === "metadata") {
            state.chatId = payload.chatId as string;
            state.userMessage = payload.userMessage as ChatMessage;
            setDraftState((current) => ({
              assistantText: current?.assistantText ?? "",
              chatId: state.chatId,
              userMessage: state.userMessage,
            }));
            return;
          }

          if (payload.type === "delta") {
            state.assistantText += payload.delta as string;
            setDraftState((current) => ({
              assistantText: state.assistantText,
              chatId: state.chatId ?? current?.chatId,
              userMessage: state.userMessage ?? current?.userMessage,
            }));
            return;
          }

          if (payload.type === "error") {
            throw new Error(
              typeof payload.error === "string"
                ? payload.error
                : "Stream failed.",
            );
          }

          if (payload.type === "done") {
            state.chatId = payload.chatId as string;
            state.assistantMessage = payload.assistantMessage as ChatMessage;
            state.session = payload.session as UserSession;
          }
        });
      }

      return state;
    },
    onSuccess: async (state) => {
      setDraftState(null);

      if (!state.chatId) {
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.chats }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages(state.chatId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.session }),
      ]);

      publishChatSync({ type: "chats-updated" });
      publishChatSync({ type: "messages-updated", chatId: state.chatId });
      publishChatSync({ type: "session-updated" });
    },
    onError: () => {
      setDraftState(null);
    },
  });

  return {
    isStreaming: mutation.isPending,
    startStream: mutation.mutateAsync,
    error: mutation.error,
    draftState,
  };
};
