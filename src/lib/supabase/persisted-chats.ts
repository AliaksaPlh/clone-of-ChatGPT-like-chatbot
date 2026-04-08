import { type SupabaseClient } from "@supabase/supabase-js";

import { formatRelativeTime } from "@/lib/chat-store/id-time";
import { buildTitleFromContent } from "@/lib/chat-store/title";
import { type ChatMessage, type ChatThread } from "@/types/chat";

const isDefaultChatTitle = (title: string) =>
  title.trim().toLowerCase() === "new chat";

export const toChatMessage = (row: {
  id: string;
  chat_id: string;
  role: string;
  content: string;
  created_at: string;
}): ChatMessage => ({
  id: row.id,
  chatId: row.chat_id,
  role: row.role as ChatMessage["role"],
  content: row.content,
  createdAt: row.created_at,
  status: "sent",
});

export const fetchAuthUserChats = async (
  supabase: SupabaseClient,
): Promise<{ data: Array<ChatThread>; error: Error | null }> => {
  const { data: chats, error } = await supabase
    .from("chats")
    .select("id, title, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  if (!chats?.length) {
    return { data: [], error: null };
  }

  const ids = chats.map((c) => c.id);
  const { data: msgs, error: msgError } = await supabase
    .from("messages")
    .select("chat_id, content, created_at")
    .in("chat_id", ids)
    .order("created_at", { ascending: false });

  if (msgError) {
    return { data: [], error: new Error(msgError.message) };
  }

  const lastByChat = new Map<string, { content: string; created_at: string }>();

  for (const m of msgs ?? []) {
    if (!lastByChat.has(m.chat_id)) {
      lastByChat.set(m.chat_id, {
        content: m.content,
        created_at: m.created_at,
      });
    }
  }

  const threads: Array<ChatThread> = chats.map((c) => {
    const last = lastByChat.get(c.id);
    const updatedIso = last?.created_at ?? c.created_at;

    return {
      id: c.id,
      title: c.title,
      preview: last?.content.slice(0, 120) ?? "No messages yet.",
      createdAt: c.created_at,
      updatedAt: formatRelativeTime(updatedIso),
    };
  });

  return { data: threads, error: null };
};

export const insertAuthChat = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: ChatThread | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from("chats")
    .insert({ user_id: userId, title: "New chat" })
    .select("id, title, created_at")
    .single();

  if (error || !data) {
    return {
      data: null,
      error: new Error(error?.message ?? "Failed to create chat."),
    };
  }

  return {
    data: {
      id: data.id,
      title: data.title,
      preview: "No messages yet.",
      createdAt: data.created_at,
      updatedAt: formatRelativeTime(data.created_at),
    },
    error: null,
  };
};

export const fetchAuthMessages = async (
  supabase: SupabaseClient,
  chatId: string,
): Promise<{ data: Array<ChatMessage>; error: Error | null }> => {
  const { data, error } = await supabase
    .from("messages")
    .select("id, chat_id, role, content, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return {
    data: (data ?? []).map(toChatMessage),
    error: null,
  };
};

export const authUserOwnsChat = async (
  supabase: SupabaseClient,
  chatId: string,
): Promise<boolean> => {
  const { data, error } = await supabase
    .from("chats")
    .select("id")
    .eq("id", chatId)
    .maybeSingle();

  return !error && Boolean(data);
};

export const getAuthChatTitle = async (
  supabase: SupabaseClient,
  chatId: string,
): Promise<string | null> => {
  const { data, error } = await supabase
    .from("chats")
    .select("title")
    .eq("id", chatId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.title;
};

export const insertAuthUserMessage = async (
  supabase: SupabaseClient,
  chatId: string,
  content: string,
): Promise<{ data: ChatMessage | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, role: "user", content })
    .select("id, chat_id, role, content, created_at")
    .single();

  if (error || !data) {
    return {
      data: null,
      error: new Error(error?.message ?? "Failed to save message."),
    };
  }

  return { data: toChatMessage(data), error: null };
};

export const insertAuthAssistantMessage = async (
  supabase: SupabaseClient,
  chatId: string,
  content: string,
): Promise<{ data: ChatMessage | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, role: "assistant", content })
    .select("id, chat_id, role, content, created_at")
    .single();

  if (error || !data) {
    return {
      data: null,
      error: new Error(error?.message ?? "Failed to save message."),
    };
  }

  return { data: toChatMessage(data), error: null };
};

export const maybeUpdateAuthChatTitleFromUserMessage = async (
  supabase: SupabaseClient,
  chatId: string,
  chatTitle: string,
  userMessageContent: string,
) => {
  if (!isDefaultChatTitle(chatTitle)) {
    return;
  }

  const newTitle = buildTitleFromContent(userMessageContent);

  await supabase.from("chats").update({ title: newTitle }).eq("id", chatId);
};
