"use client";

import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  useRef,
  useState,
} from "react";

import { ArrowUp, FileText, ImagePlus, Mic, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";

type ChatInputProps = {
  chatId?: string;
  isStreaming: boolean;
  isUploading?: boolean;
  /** if true the limit omitted */
  isUnlimitedPrompts?: boolean;
  remainingFreePrompts: number;
  onUploadFiles: (files: Array<File>) => Promise<void>;
  onSendMessage: (content: string) => Promise<void>;
};

export const ChatInput = ({
  chatId,
  isStreaming,
  isUploading = false,
  isUnlimitedPrompts = false,
  remainingFreePrompts,
  onUploadFiles,
  onSendMessage,
}: ChatInputProps) => {
  const [value, setValue] = useState("");
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  const isDisabled =
    isStreaming ||
    isUploading ||
    (!isUnlimitedPrompts && remainingFreePrompts <= 0);

  const handleUpload = async (files: Array<File>) => {
    if (!chatId || !files.length) {
      return;
    }

    await onUploadFiles(files);
  };

  const handleImageSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    await handleUpload(files);
    event.target.value = "";
  };

  const handleDocumentSelection = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);

    await handleUpload(files);
    event.target.value = "";
  };

  const handleSubmit = async () => {
    const normalized = value.trim();

    if (!normalized || isDisabled) {
      return;
    }

    await onSendMessage(normalized);
    setValue("");
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    await handleSubmit();
  };

  const handlePaste = async (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (!files.length) {
      return;
    }

    event.preventDefault();
    await handleUpload(files);
  };

  return (
    <div className="sticky bottom-0 space-y-3 rounded-[28px] border border-black/5 bg-white/95 p-3 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageSelection}
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".txt,.md,.pdf,.doc,.docx"
        multiple
        className="hidden"
        onChange={handleDocumentSelection}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          iconLeft={<ImagePlus className="size-4" />}
          size="sm"
          variant="secondary"
          onClick={() => imageInputRef.current?.click()}
          disabled={!chatId || isUploading}
        >
          Add image
        </Button>
        <Button
          iconLeft={<FileText className="size-4" />}
          size="sm"
          variant="secondary"
          onClick={() => documentInputRef.current?.click()}
          disabled={!chatId || isUploading}
        >
          Add document
        </Button>
      </div>

      <div className="rounded-[24px] border border-zinc-200 bg-white p-4">
        <textarea
          rows={4}
          placeholder="Message the assistant..."
          className="w-full resize-none border-0 bg-transparent text-sm leading-7 text-zinc-900 outline-none placeholder:text-zinc-400"
          data-test-id="chat-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={isDisabled}
        />

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button aria-label="Attach files" size="icon" variant="ghost">
              <Paperclip className="size-4" />
            </Button>
            <Button aria-label="Voice input" size="icon" variant="ghost">
              <Mic className="size-4" />
            </Button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isDisabled || !value.trim()}
            iconLeft={<ArrowUp className="size-4" />}
          >
            {isStreaming ? "Streaming..." : "Send"}
          </Button>
        </div>
      </div>

      <p className="px-1 text-center text-xs leading-5 text-zinc-400">
        {isUnlimitedPrompts
          ? "Signed in — no prompt limit for this app session."
          : remainingFreePrompts > 0
            ? `${remainingFreePrompts} anonymous prompts remaining in this session.`
            : "Anonymous limit reached. Sign in via the sidebar to continue."}{" "}
        Paste an image or upload a document to include it in context.
      </p>
    </div>
  );
};
