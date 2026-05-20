"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Message, Attachment, Conversation, MedicalSkillType } from "@/types";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";
import { ChatSidebar } from "./chat-sidebar";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { createConversation, createUserMessage, createAssistantMessage, updateConversationTitle } from "@/services/chat-service";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Moon, Sun, Stethoscope } from "lucide-react";

export function ChatContainer() {
  const { value: conversations, setValue: setConversations, isLoaded } =
    useLocalStorage<Conversation[]>("medassist-conversations", []);
  const { value: activeId, setValue: setActiveId } =
    useLocalStorage<string | null>("medassist-active-id", null);
  const { value: isDarkMode, setValue: setIsDarkMode } =
    useLocalStorage<boolean>("medassist-dark-mode", false);

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [currentSkill, setCurrentSkill] = useState<MedicalSkillType | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get active conversation
  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, streamingContent]);

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  // Create new conversation
  const handleNewChat = useCallback(() => {
    const newConv = createConversation();
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    setIsSidebarOpen(false);
  }, [setConversations, setActiveId]);

  // Send message
  const handleSendMessage = useCallback(
    async (content: string, attachments?: Attachment[]) => {
      let conv = activeConversation;
      let isNewConv = false;

      // Create new conversation if none active
      if (!conv) {
        conv = createConversation();
        isNewConv = true;
      }

      // Create user message
      const userMessage = createUserMessage(content, attachments);

      // Update conversation with user message
      const updatedMessages = [...conv.messages, userMessage];
      let updatedConv: Conversation = {
        ...conv,
        messages: updatedMessages,
        updatedAt: Date.now(),
      };
      updatedConv = updateConversationTitle(updatedConv);

      // Update state: either add new or update existing
      if (isNewConv) {
        setConversations((prev) => [updatedConv, ...prev]);
        setActiveId(updatedConv.id);
      } else {
        setConversations((prev) =>
          prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
        );
      }

      // Start streaming
      setIsStreaming(true);
      setStreamingContent("");
      setCurrentSkill(null);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updatedMessages }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullContent = "";
        let skill: MedicalSkillType = "general";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Keep the last potentially incomplete line in buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              try {
                const data = JSON.parse(trimmed.slice(6));
                if (data.type === "skill") {
                  skill = data.skill;
                  setCurrentSkill(data.skill);
                } else if (data.type === "text") {
                  fullContent += data.content;
                  setStreamingContent(fullContent);
                } else if (data.type === "error") {
                  console.error("Stream error:", data.message);
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim().startsWith("data: ")) {
          try {
            const data = JSON.parse(buffer.trim().slice(6));
            if (data.type === "text") {
              fullContent += data.content;
            }
          } catch {}
        }

        // Create assistant message and add to conversation
        const assistantMessage = createAssistantMessage(fullContent, {
          agentUsed: skill,
        });

        setConversations((prev) =>
          prev.map((c) =>
            c.id === updatedConv.id
              ? {
                  ...updatedConv,
                  messages: [...updatedMessages, assistantMessage],
                  updatedAt: Date.now(),
                }
              : c
          )
        );
      } catch (error: any) {
        console.error("Chat error:", error);
        const errorMessage = createAssistantMessage(
          "I'm sorry, I encountered an error processing your request. Please try again.",
          { agentUsed: "general" }
        );
        setConversations((prev) =>
          prev.map((c) =>
            c.id === updatedConv.id
              ? {
                  ...updatedConv,
                  messages: [...updatedMessages, errorMessage],
                  updatedAt: Date.now(),
                }
              : c
          )
        );
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        setCurrentSkill(null);
      }
    },
    [activeConversation, setConversations, setActiveId]
  );

  // Delete conversation
  const handleDeleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        setActiveId(remaining.length > 0 ? remaining[0].id : null);
      }
    },
    [conversations, activeId, setConversations, setActiveId]
  );

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-pulse flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-medical-primary" />
          <span className="text-lg font-medium">Loading MedAssist...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        isOpen={isSidebarOpen}
        onSelect={(id) => {
          setActiveId(id);
          setIsSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onDelete={handleDeleteConversation}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-accent transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-medical-primary to-medical-secondary flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-sm">MedAssist Agent</h1>
                <p className="text-xs text-muted-foreground">Medical Assistant</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              title="New chat"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <WelcomeScreen />
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              <AnimatePresence>
                {activeConversation.messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChatMessage message={msg} />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Streaming message */}
              {isStreaming && streamingContent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ChatMessage
                    message={{
                      id: "streaming",
                      role: "assistant",
                      content: streamingContent,
                      timestamp: Date.now(),
                      metadata: { agentUsed: currentSkill || "general" },
                    }}
                    isStreaming
                  />
                </motion.div>
              )}

              {/* Loading indicator */}
              {isStreaming && !streamingContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-medical-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-medical-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-medical-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-sm">
                    {currentSkill ? `${currentSkill} analyzing...` : "Thinking..."}
                  </span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSendMessage} isLoading={isStreaming} />
      </div>
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-medical-primary to-medical-secondary flex items-center justify-center mb-6 mx-auto">
          <Stethoscope className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to MedAssist Agent</h2>
        <p className="text-muted-foreground mb-8">
          Your intelligent medical assistant. Ask about symptoms, upload medical documents, or get health information.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {[
            { title: "Symptom Analysis", desc: "Describe your symptoms for a preliminary assessment" },
            { title: "Report Reading", desc: "Upload lab reports or medical documents" },
            { title: "Medication Info", desc: "Learn about medications and interactions" },
            { title: "Health Education", desc: "Get evidence-based health information" },
          ].map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors cursor-default"
            >
              <h3 className="font-medium text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-8 max-w-md">
          ⚕️ Disclaimer: This AI assistant provides general health information only.
          It does not replace professional medical advice, diagnosis, or treatment.
        </p>
      </motion.div>
    </div>
  );
}
