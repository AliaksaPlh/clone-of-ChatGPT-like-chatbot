import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const stream = await client.responses.create({
  model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  instructions: "You are a coding assistant that talks like a pirate",
  input: [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: "What is in this image?",
        },
        {
          type: "input_image",
          image_url:
            "https://openai-documentation.vercel.app/images/cat_and_otter.png",
        },
      ],
    },
  ],
  stream: true,
});

for await (const event of stream) {
  if (event.type === "response.output_text.delta") {
    process.stdout.write(event.delta);
  }
}

process.stdout.write("\n");
