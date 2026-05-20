import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Transcription endpoint - uses Gemini to transcribe audio
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audioBase64, mimeType } = body;

    if (!audioBase64 || !mimeType) {
      return NextResponse.json(
        { error: "audioBase64 and mimeType are required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const model = genAI.getGenerativeModel({
      model: config.gemini.model,
    });

    const result = await model.generateContent([
      {
        text: "Transcribe this audio recording. Return ONLY the spoken text, nothing else. If you cannot understand the audio, return an empty string.",
      },
      {
        inlineData: {
          mimeType,
          data: audioBase64,
        },
      },
    ]);

    const text = result.response.text().trim();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Transcription failed", details: error.message },
      { status: 500 }
    );
  }
}
