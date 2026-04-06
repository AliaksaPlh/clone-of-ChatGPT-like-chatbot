export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export const getOpenAIModel = () => {
  const fromEnv = process.env.OPENAI_MODEL?.trim();

  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_OPENAI_MODEL;
};
