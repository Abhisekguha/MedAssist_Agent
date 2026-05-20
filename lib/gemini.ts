import { GoogleGenerativeAI, Content, Part } from "@google/generative-ai";
import { Attachment, Message } from "@/types";
import { config } from "@/lib/config";

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export function getGeminiModel() {
  return genAI.getGenerativeModel({
    model: config.gemini.model,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 4096,
    },
  });
}

/** Convert our Message[] into Gemini Content format */
export function buildGeminiContents(
  messages: Message[],
  systemPrompt: string
): Content[] {
  const contents: Content[] = [];

  for (const msg of messages) {
    const parts: Part[] = [];

    // Add text content
    if (msg.content) {
      parts.push({ text: msg.content });
    }

    // Add image attachments as inline data
    if (msg.attachments) {
      for (const att of msg.attachments) {
        if (att.type === "image" && att.base64) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.base64,
            },
          });
        }
      }
    }

    if (parts.length > 0) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts,
      });
    }
  }

  return contents;
}

/** Stream a response from Gemini */
export async function* streamGeminiResponse(
  messages: Message[],
  systemPrompt: string,
  attachments?: Attachment[]
) {
  const model = getGeminiModel();

  const contents = buildGeminiContents(messages, systemPrompt);

  const chat = model.startChat({
    history: contents.slice(0, -1),
    systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
  });

  const lastMessage = contents[contents.length - 1];
  const result = await chat.sendMessageStream(lastMessage.parts);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }
}

/** Non-streaming response */
export async function getGeminiResponse(
  messages: Message[],
  systemPrompt: string
): Promise<string> {
  const model = getGeminiModel();
  const contents = buildGeminiContents(messages, systemPrompt);

  const chat = model.startChat({
    history: contents.slice(0, -1),
    systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
  });

  const lastMessage = contents[contents.length - 1];
  const result = await chat.sendMessage(lastMessage.parts);
  return result.response.text();
}
