import type { ResponseStreamEvent } from "openai/resources/responses/responses";

export type StreamProcessResult = {
  error?: string;
};

export const processOpenAIResponseStream = async (
  stream: AsyncIterable<ResponseStreamEvent>,
  onDelta: (delta: string) => void,
): Promise<StreamProcessResult> => {
  for await (const event of stream) {
    if (event.type === "response.output_text.delta") {
      onDelta(event.delta);
      continue;
    }

    if (event.type === "response.refusal.delta") {
      onDelta(event.delta);
      continue;
    }

    if (event.type === "error") {
      return { error: event.message };
    }

    if (event.type === "response.failed") {
      return {
        error:
          event.response.error?.message ??
          "The model could not complete the response.",
      };
    }
  }

  return {};
};
