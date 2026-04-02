import { FileText, ImageIcon } from "lucide-react";

import { type ChatAttachment } from "@/types/chat";

type AttachmentItemProps = {
  attachment: ChatAttachment;
};

export const AttachmentItem = ({ attachment }: AttachmentItemProps) => {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2">
      <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
        {attachment.type === "image" ? (
          <ImageIcon className="size-4" />
        ) : (
          <FileText className="size-4" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-900">
          {attachment.name}
        </p>
        <p className="text-xs text-zinc-500">{attachment.sizeLabel}</p>
      </div>
    </div>
  );
};
