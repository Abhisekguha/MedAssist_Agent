import { NextRequest, NextResponse } from "next/server";
import { extractTextFromImage, cleanOCRText } from "@/services/ocr-service";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * OCR endpoint - extracts text from uploaded images
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "imageBase64 and mimeType are required" },
        { status: 400 }
      );
    }

    const result = await extractTextFromImage(imageBase64, mimeType);
    const cleanedText = cleanOCRText(result.text);

    return NextResponse.json({
      text: cleanedText,
      confidence: result.confidence,
      language: result.language,
    });
  } catch (error: any) {
    console.error("OCR API error:", error);
    return NextResponse.json(
      { error: "OCR processing failed", details: error.message },
      { status: 500 }
    );
  }
}
