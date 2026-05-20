import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedAssist Agent - Medical Assistant",
  description:
    "AI-powered medical assistant for symptom analysis, report reading, and health information. Powered by Gemini 3.1 Flash.",
  keywords: ["medical assistant", "AI", "health", "symptoms", "medical reports"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
