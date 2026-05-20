"use client";

import { useState, useRef, useCallback } from "react";
import { Attachment } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface UseFileUploadOptions {
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    maxFiles = 5,
    maxSizeMB = 10,
    acceptedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"],
  } = options;

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File): Promise<Attachment | null> => {
      // Validate size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File ${file.name} exceeds ${maxSizeMB}MB limit`);
        return null;
      }

      // Validate type
      if (!acceptedTypes.includes(file.type)) {
        setError(`File type ${file.type} is not supported`);
        return null;
      }

      // Convert to base64
      const base64 = await fileToBase64(file);

      const type = file.type.startsWith("image/") ? "image" : "pdf";

      return {
        id: uuidv4(),
        type,
        name: file.name,
        url: URL.createObjectURL(file),
        mimeType: file.type,
        base64,
        size: file.size,
      };
    },
    [maxSizeMB, acceptedTypes]
  );

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      if (attachments.length + fileArray.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const processed = await Promise.all(fileArray.map(processFile));
      const valid = processed.filter(Boolean) as Attachment[];

      setAttachments((prev) => [...prev, ...valid]);
    },
    [attachments.length, maxFiles, processFile]
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att?.url) URL.revokeObjectURL(att.url);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    attachments.forEach((att) => {
      if (att.url) URL.revokeObjectURL(att.url);
    });
    setAttachments([]);
  }, [attachments]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    attachments,
    error,
    fileInputRef,
    addFiles,
    removeAttachment,
    clearAttachments,
    openFilePicker,
  };
}

/** Convert a File to base64 string (without data URL prefix) */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:mime;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
