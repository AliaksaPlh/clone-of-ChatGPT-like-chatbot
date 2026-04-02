import { apiClient } from "@/services/api-client";
import {
  type ChatsResponse,
  type MessagesResponse,
  type UploadResponse,
  type UserSession,
} from "@/types/chat";

type SessionResponse = {
  data: UserSession;
};

const buildApiError = async (response: Response, fallbackMessage: string) => {
  try {
    const payload = (await response.json()) as { error?: string };

    if (payload.error) {
      return new Error(payload.error);
    }
  } catch {
    return new Error(fallbackMessage);
  }

  return new Error(fallbackMessage);
};

export const chatApi = {
  getChats: async () => apiClient.get<ChatsResponse>("/api/chats"),
  createChat: async () =>
    apiClient.post<{
      data: ChatsResponse["data"][number];
    }>("/api/chats"),
  getMessages: async (chatId: string) =>
    apiClient.get<MessagesResponse>(
      `/api/messages?chatId=${encodeURIComponent(chatId)}`,
    ),
  getSession: async () => apiClient.get<SessionResponse>("/api/session"),
  uploadFiles: async (chatId: string, files: Array<File>) => {
    const formData = new FormData();

    formData.append("chatId", chatId);
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch("/api/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      throw await buildApiError(response, "Upload failed.");
    }

    return (await response.json()) as UploadResponse;
  },
};
