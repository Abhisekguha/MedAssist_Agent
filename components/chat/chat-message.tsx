"use client";

import { Message } from "@/types";
import { formatTime } from "@/utils/format";
import { getSkillBadge } from "@/services/chat-service";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Bot, AlertTriangle, Image as ImageIcon, FileText } from "lucide-react";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isEmergency = message.metadata?.agentUsed === "emergency-detector";
  const skillBadge = message.metadata?.agentUsed
    ? getSkillBadge(message.metadata.agentUsed)
    : null;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isUser
            ? "bg-gradient-to-br from-indigo-500 to-purple-500"
            : isEmergency
            ? "bg-gradient-to-br from-red-500 to-orange-500"
            : "bg-gradient-to-br from-medical-primary to-medical-secondary"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : isEmergency ? (
          <AlertTriangle className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Skill Badge */}
        {!isUser && skillBadge && (
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full mb-1 ${skillBadge.color}`}
          >
            {skillBadge.label}
          </span>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.attachments.map((att) => (
              <div key={att.id} className="rounded-lg overflow-hidden border border-border">
                {att.type === "image" ? (
                  <img
                    src={att.url || `data:${att.mimeType};base64,${att.base64}`}
                    alt={att.name}
                    className="max-w-[200px] max-h-[200px] object-cover"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-accent">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">{att.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-medical-primary text-white rounded-tr-sm"
              : isEmergency
              ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-tl-sm"
              : "bg-card border border-border rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1 prose-table:my-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-medical-primary animate-pulse ml-0.5" />
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground mt-1 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
