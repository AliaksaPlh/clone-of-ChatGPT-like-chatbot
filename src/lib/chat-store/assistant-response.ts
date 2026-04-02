import { type ChatAttachment } from "@/types/chat";

export const buildAssistantResponse = (
  prompt: string,
  attachments: Array<ChatAttachment>,
) => {
  const normalized = prompt.trim();
  const contextLines = attachments
    .map((attachment) => {
      const summary = attachment.textPreview?.slice(0, 160);

      return `- ${attachment.name}${summary ? `: ${summary}` : ""}`;
    })
    .join("\n");

  return [
    "Here is a simple homemade dog cookie recipe:",
    "",
    "1. Mix 1 cup of oat flour, 1 mashed banana, and 2 tablespoons of peanut butter.",
    "2. Add 1 egg and stir until a soft dough forms.",
    "3. Cut into small shapes and bake at 180°C (350°F) for 15–20 minutes.",
    "4. Let the cookies cool completely before serving them to your dog.",
    "",
    ...(attachments.length
      ? ["Context from uploaded files:", contextLines, ""]
      : []),
    `Prompt summary: ${normalized || "No prompt provided."}`,
  ].join("\n");
};
