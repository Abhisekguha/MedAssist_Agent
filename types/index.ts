export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  metadata?: MessageMetadata;
}

export interface Attachment {
  id: string;
  type: "image" | "pdf" | "audio";
  name: string;
  url: string;
  mimeType: string;
  base64?: string;
  size?: number;
}

export interface MessageMetadata {
  agentUsed?: MedicalSkillType;
  confidence?: number;
  isEmergency?: boolean;
  processingTime?: number;
  tokens?: number;
}

export type MedicalSkillType =
  | "symptom-triage"
  | "report-analyzer"
  | "prescription-reader"
  | "medication-explainer"
  | "medical-ocr"
  | "health-education"
  | "emergency-detector"
  | "followup-generator"
  | "general";

export interface MedicalSkill {
  id: MedicalSkillType;
  name: string;
  description: string;
  triggers: string[];
  systemPrompt: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatRequest {
  messages: Message[];
  attachments?: Attachment[];
  conversationId: string;
}

export interface ChatResponse {
  message: Message;
  skill: MedicalSkillType;
  confidence: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  language?: string;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob?: Blob;
}

export interface AppState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isDarkMode: boolean;
  isSidebarOpen: boolean;
}
