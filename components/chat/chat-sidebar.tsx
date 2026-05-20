"use client";

import { Conversation } from "@/types";
import { formatDate, truncate } from "@/utils/format";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Plus,
  Trash2,
  X,
  Stethoscope,
} from "lucide-react";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  isOpen: boolean;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function ChatSidebar({
  conversations,
  activeId,
  isOpen,
  onSelect,
  onNewChat,
  onDelete,
  onClose,
}: ChatSidebarProps) {
  // Group conversations by date
  const grouped = groupByDate(conversations);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:translate-x-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-medical-primary to-medical-secondary flex items-center justify-center">
              <Stethoscope className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm">MedAssist</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onNewChat}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              title="New chat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">No conversations yet</p>
              <button
                onClick={onNewChat}
                className="mt-3 text-xs text-medical-primary hover:underline"
              >
                Start a new chat
              </button>
            </div>
          ) : (
            Object.entries(grouped).map(([date, convs]) => (
              <div key={date} className="mb-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
                  {date}
                </p>
                {convs.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors mb-0.5 ${
                      conv.id === activeId
                        ? "bg-accent border border-border"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => onSelect(conv.id)}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                    <span className="text-xs flex-1 truncate">
                      {conv.title}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv.id);
                      }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            Powered by Gemini 3.1 Flash
          </p>
        </div>
      </aside>
    </>
  );
}

/** Group conversations by date */
function groupByDate(
  conversations: Conversation[]
): Record<string, Conversation[]> {
  const groups: Record<string, Conversation[]> = {};

  for (const conv of conversations) {
    const date = formatDate(conv.updatedAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(conv);
  }

  return groups;
}
