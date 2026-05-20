# MedAssist AI - Multimodal Medical Assistant

A production-ready, agentic medical assistant web application built with Next.js 15, Gemini 2.5 Flash, and deployed on Vercel.

## Features

- **Multimodal Input**: Text, images, PDFs, and voice (Speech-to-Text)
- **Streaming Responses**: Real-time AI response streaming
- **Agentic Medical Skills**: Automatic routing to specialized medical agents
- **OCR Pipeline**: Extract text from medical documents and prescriptions
- **Dark/Light Mode**: Full theme support
- **Chat History**: Persistent conversations via localStorage
- **Mobile Responsive**: Works on all devices
- **Medical Safety**: Built-in safety guardrails and disclaimers

## Medical Skills (Agents)

| Agent | Purpose |
|-------|---------|
| Emergency Detector | Identifies life-threatening symptoms |
| Symptom Triage | Assesses symptoms with urgency levels |
| Report Analyzer | Interprets lab results and medical reports |
| Prescription Reader | Explains prescriptions and dosages |
| Medication Explainer | Detailed drug information |
| Medical OCR | Extracts text from medical images |
| Health Education | General wellness information |
| Follow-up Generator | Suggests clarifying questions |

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **AI Model**: Gemini 2.5 Flash
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **OCR**: Tesseract.js
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Gemini API key

### Installation

```bash
# Clone or navigate to project
cd medical-assistant

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Add your Gemini API key to .env
# GEMINI_API_KEY=your_key_here

# Run development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key from: https://aistudio.google.com/apikey

## Deployment to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variable
vercel env add GEMINI_API_KEY
```

### Option 2: Vercel Dashboard

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add `GEMINI_API_KEY` to Environment Variables
5. Deploy

## Project Structure

```
/app
  /api
    /chat/route.ts          # Main chat API with streaming
    /ocr/route.ts           # OCR endpoint
  layout.tsx                # Root layout
  page.tsx                  # Main page
  globals.css               # Global styles + CSS variables
/agents
  router.ts                 # Agent routing logic
  symptom-triage.ts         # Symptom analysis agent
  report-analyzer.ts        # Medical report agent
  prescription-reader.ts    # Prescription agent
  emergency-detector.ts     # Emergency detection agent
/components
  /chat
    chat-container.tsx      # Main chat orchestrator
    chat-input.tsx          # Multimodal input component
    chat-message.tsx        # Message rendering with markdown
    chat-sidebar.tsx        # Conversation history sidebar
/hooks
  use-file-upload.ts        # File upload handling
  use-voice-recorder.ts     # Voice recording (Web Speech API)
  use-local-storage.ts      # localStorage persistence
/lib
  gemini.ts                 # Gemini AI client
  utils.ts                  # Utility functions
/services
  ocr-service.ts            # OCR text extraction
  chat-service.ts           # Chat state management
/types
  index.ts                  # TypeScript type definitions
/utils
  format.ts                 # Formatting utilities
  medical-prompts.ts        # System prompts & skill definitions
```

## How It Works

1. **User sends a message** (text, image, voice, or file)
2. **Agent Router** analyzes the input and selects the best medical skill
3. **System prompt** is composed based on the selected skill
4. **Gemini 2.5 Flash** processes the request with the specialized prompt
5. **Response streams** back in real-time with markdown formatting
6. **Skill badge** indicates which agent handled the request

## Safety & Disclaimers

This application:
- Does NOT provide medical diagnoses
- Does NOT prescribe medications
- Detects emergency symptoms and urges professional help
- Uses uncertainty-aware language
- Includes disclaimers throughout the UI
- Encourages consulting healthcare professionals

## License

MIT
