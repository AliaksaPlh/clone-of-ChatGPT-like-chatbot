import OpenAI from "openai";

export const isOpenAIConfigured = () =>
  Boolean(process.env.OPENAI_API_KEY?.trim());

export const createOpenAIClient = (): OpenAI | null => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
};
