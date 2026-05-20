import { OCRResult } from "@/types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "@/lib/config";

/**
 * OCR Service - Uses Gemini API for text extraction from images.
 * No separate OCR engine needed — Gemini handles vision natively.
 */

/** Extract text from an image using Gemini vision */
export async function extractTextFromImage(
  imageBase64: string,
  mimeType: string
): Promise<OCRResult> {
  try {
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const model = genAI.getGenerativeModel({
      model: config.gemini.model,
    });

    const result = await model.generateContent([
      {
        text: `Extract ALL text from this image. Return the raw text exactly as it appears, preserving layout and structure. If this is a medical document, prescription, or lab report, include all values, headers, and labels. Do not summarize — extract verbatim.`,
      },
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ]);

    const text = result.response.text();

    return {
      text: text.trim(),
      confidence: 0.95,
      language: "en",
    };
  } catch (error) {
    console.error("Gemini OCR failed:", error);
    return {
      text: "",
      confidence: 0,
      language: "en",
    };
  }
}

/** Clean up OCR text output */
export function cleanOCRText(rawText: string): string {
  return rawText
    .replace(/\n{3,}/g, "\n\n") // Remove excessive newlines
    .replace(/[ \t]+/g, " ") // Normalize spaces
    .replace(/^\s+|\s+$/gm, "") // Trim lines
    .trim();
}

/** Detect if an image likely contains medical content */
export function detectMedicalDocument(text: string): {
  isMedical: boolean;
  documentType: string;
} {
  const lowerText = text.toLowerCase();

  const medicalKeywords = [
    "patient", "diagnosis", "prescription", "rx", "mg", "tablet",
    "blood", "hemoglobin", "glucose", "cholesterol", "report",
    "doctor", "dr.", "hospital", "clinic", "lab", "test",
    "medication", "dosage", "treatment", "symptoms"
  ];

  const matchCount = medicalKeywords.filter((kw) =>
    lowerText.includes(kw)
  ).length;

  const isMedical = matchCount >= 2;

  let documentType = "unknown";
  if (lowerText.includes("prescription") || lowerText.includes("rx")) {
    documentType = "prescription";
  } else if (lowerText.includes("lab") || lowerText.includes("test") || lowerText.includes("result")) {
    documentType = "lab_report";
  } else if (lowerText.includes("discharge") || lowerText.includes("summary")) {
    documentType = "discharge_summary";
  } else if (lowerText.includes("radiology") || lowerText.includes("imaging")) {
    documentType = "radiology_report";
  } else if (isMedical) {
    documentType = "medical_document";
  }

  return { isMedical, documentType };
}
