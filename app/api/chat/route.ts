import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { routeToSkill } from "@/agents/router";
import { getSkillPrompt } from "@/utils/medical-prompts";
import { Message } from "@/types";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body as { messages: Message[] };

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = config.gemini.apiKey;

    // Route to appropriate medical skill
    const skill = routeToSkill(messages);
    const systemPrompt = getSkillPrompt(skill);

    // Build Gemini request
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: config.gemini.model,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });

    // Convert messages to Gemini format
    const geminiHistory = messages.slice(0, -1).map((msg) => {
      const parts: any[] = [];

      if (msg.content) {
        parts.push({ text: msg.content });
      }

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

      return {
        role: msg.role === "assistant" ? "model" : "user",
        parts: parts.length > 0 ? parts : [{ text: "" }],
      };
    });

    // Build the last message parts
    const lastMessage = messages[messages.length - 1];
    const lastParts: any[] = [];

    if (lastMessage.content) {
      lastParts.push({ text: lastMessage.content });
    }

    if (lastMessage.attachments) {
      for (const att of lastMessage.attachments) {
        if (att.type === "image" && att.base64) {
          lastParts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.base64,
            },
          });
        }
      }
    }

    // Start chat with system instruction
    const chat = model.startChat({
      history: geminiHistory,
      systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
    });

    // Stream the response
    const result = await chat.sendMessageStream(lastParts);

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send the skill metadata as the first chunk
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "skill", skill })}\n\n`)
          );

          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "text", content: text })}\n\n`)
              );
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: "Stream interrupted" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
