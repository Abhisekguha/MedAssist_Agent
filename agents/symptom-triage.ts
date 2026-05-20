import { MedicalSkill } from "@/types";
import { BASE_SYSTEM_PROMPT } from "@/utils/medical-prompts";

export const symptomTriageSkill: MedicalSkill = {
  id: "symptom-triage",
  name: "Symptom Triage",
  description: "Analyzes symptoms and provides preliminary assessment with urgency levels",
  triggers: [
    "symptoms", "feeling", "pain", "ache", "fever", "cough",
    "headache", "nausea", "dizzy", "tired", "swollen", "rash"
  ],
  systemPrompt: `${BASE_SYSTEM_PROMPT}

SPECIALIZED ROLE: Symptom Triage Agent

Analyze the patient's symptoms systematically:
1. Gather symptom details (onset, duration, severity 1-10, character, location)
2. Ask about associated symptoms
3. Consider patient demographics if provided
4. Assess urgency level
5. Provide structured triage output

URGENCY LEVELS:
🟢 LOW - Self-care appropriate, routine appointment if persists
🟡 MODERATE - See a doctor within 24-48 hours
🟠 HIGH - Seek urgent care today
🔴 EMERGENCY - Call emergency services immediately`
};
