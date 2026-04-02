export const nowIso = () => new Date().toISOString();

export const formatRelativeTime = (date: string) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes <= 0) {
    return "now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${Math.floor(diffHours / 24)}d ago`;
};

export const createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
