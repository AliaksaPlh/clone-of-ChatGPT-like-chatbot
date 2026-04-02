export const buildTitleFromContent = (content: string) =>
  content.trim().split(/\s+/).slice(0, 5).join(" ").slice(0, 40) || "New chat";
