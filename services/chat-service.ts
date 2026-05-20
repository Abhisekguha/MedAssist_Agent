import { Message, Conversation, MedicalSkillType } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { generateTitle } from "@/utils/format";

/**
 * Chat Service - Manages conversation state and message processing
 */

/** Create a new conversation */
export function createConversation(): Conversation {
  return {
    id: uuidv4(),
    title: "New Conversation",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/** Create a user message */
export function createUserMessage(
  content: string,
  attachments?: Message["attachments"]
): Message {
  return {
    id: uuidv4(),
    role: "user",
    content,
    timestamp: Date.now(),
    attachments,
  };
}

/** Create an assistant message */
export function createAssistantMessage(
  content: string,
  metadata?: Message["metadata"]
): Message {
  return {
    id: uuidv4(),
    role: "assistant",
    content,
    timestamp: Date.now(),
    metadata,
  };
}

/** Update conversation title from first message */
export function updateConversationTitle(
  conversation: Conversation
): Conversation {
  if (conversation.messages.length === 1) {
    const firstMessage = conversation.messages[0];
    return {
      ...conversation,
      title: generateTitle(firstMessage.content),
    };
  }
  return conversation;
}

/** Get skill display info */
export function getSkillBadge(skill: MedicalSkillType): {
  label: string;
  color: string;
} {
  const badges: Record<MedicalSkillType, { label: string; color: string }> = {
    "symptom-triage": { label: "Symptom Triage", color: "bg-blue-100 text-blue-700" },
    "report-analyzer": { label: "Report Analysis", color: "bg-purple-100 text-purple-700" },
    "prescription-reader": { label: "Prescription", color: "bg-green-100 text-green-700" },
    "medication-explainer": { label: "Medication Info", color: "bg-cyan-100 text-cyan-700" },
    "medical-ocr": { label: "Document OCR", color: "bg-orange-100 text-orange-700" },
    "health-education": { label: "Health Education", color: "bg-emerald-100 text-emerald-700" },
    "emergency-detector": { label: "⚠️ Emergency", color: "bg-red-100 text-red-700" },
    "followup-generator": { label: "Follow-up", color: "bg-indigo-100 text-indigo-700" },
    general: { label: "General", color: "bg-gray-100 text-gray-700" },
  };
  return badges[skill] || badges.general;
}
