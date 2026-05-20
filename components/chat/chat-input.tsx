"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Attachment } from "@/types";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  X,
  Image as ImageIcon,
  FileText,
  Loader2,
} from "lucide-react";
import { formatFileSize } from "@/utils/format";

interface ChatInputProps {
  onSend: (content: string, attachments?: Attachment[]) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    attachments,
    error: fileError,
    fileInputRef,
    addFiles,
    removeAttachment,
    clearAttachments,
    openFilePicker,
  } = useFileUpload();

  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported: voiceSupported,
    error: voiceError,
  } = useVoiceRecorder();

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed && attachments.length === 0) return;
    if (isLoading) return;

    const content = trimmed || (attachments.length > 0 ? "Please analyze the attached file(s)." : "");
    onSend(content, attachments.length > 0 ? attachments : undefined);
    setInput("");
    clearAttachments();

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      const transcript = await stopRecording();
      if (transcript) {
        setInput((prev) => (prev ? prev + " " + transcript : transcript));
      }
    } else {
      await startRecording();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {/* File Error */}
        {(fileError || voiceError) && (
          <div className="mb-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg">
            {fileError || voiceError}
          </div>
        )}

        {/* Attachment Previews */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 flex flex-wrap gap-2"
            >
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative group flex items-center gap-2 px-3 py-2 rounded-lg bg-accent border border-border"
                >
                  {att.type === "image" ? (
                    <div className="w-10 h-10 rounded overflow-hidden">
                      <img
                        src={att.url}
                        alt={att.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-medium truncate max-w-[120px]">
                      {att.name}
                    </span>
                    {att.size && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatFileSize(att.size)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording Indicator */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-600 dark:text-red-400">
                Recording... {duration}s
              </span>
              <button
                onClick={cancelRecording}
                className="ml-auto text-xs text-red-500 hover:text-red-700"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div
          className="flex items-end gap-2 bg-background border border-border rounded-2xl px-4 py-2 focus-within:border-medical-primary focus-within:ring-1 focus-within:ring-medical-primary/20 transition-all"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {/* File Upload Button */}
          <button
            onClick={openFilePicker}
            className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="Attach files"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe your symptoms, ask a question, or upload a document..."
            rows={1}
            className="flex-1 resize-none bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground max-h-[200px] py-2"
            disabled={isLoading}
          />

          {/* Voice Button */}
          {voiceSupported && (
            <button
              onClick={handleVoiceToggle}
              className={`p-2 rounded-lg transition-colors ${
                isRecording
                  ? "bg-red-100 dark:bg-red-950 text-red-500"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              }`}
              title={isRecording ? "Stop recording" : "Start voice input"}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && attachments.length === 0)}
            className="p-2 rounded-lg bg-medical-primary text-white hover:bg-medical-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          MedAssist Agent provides general information only. Always consult a healthcare professional for medical advice.
        </p>
      </div>
    </div>
  );
}
