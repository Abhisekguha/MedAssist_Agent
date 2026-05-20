import { Message, MedicalSkillType } from "@/types";
import { MEDICAL_SKILLS } from "@/utils/medical-prompts";

/**
 * Agent Router - Determines which medical skill should handle the user's request.
 * Uses keyword matching and context analysis to route to the appropriate agent.
 */
export function routeToSkill(messages: Message[]): MedicalSkillType {
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  if (!lastUserMessage) return "general";

  const content = lastUserMessage.content.toLowerCase();
  const hasAttachments = lastUserMessage.attachments && lastUserMessage.attachments.length > 0;
  const hasImageAttachment = lastUserMessage.attachments?.some(
    (a) => a.type === "image"
  );
  const hasPdfAttachment = lastUserMessage.attachments?.some(
    (a) => a.type === "pdf"
  );

  // Priority 1: Emergency detection (always check first)
  const emergencySkill = MEDICAL_SKILLS.find((s) => s.id === "emergency-detector")!;
  if (emergencySkill.triggers.some((trigger) => content.includes(trigger))) {
    return "emergency-detector";
  }

  // Priority 2: If there are image attachments, likely OCR or report analysis
  if (hasImageAttachment) {
    // Check if it's a report/lab result
    const reportKeywords = ["report", "lab", "result", "test", "blood", "scan"];
    if (reportKeywords.some((kw) => content.includes(kw))) {
      return "report-analyzer";
    }
    // Check if it's a prescription
    const rxKeywords = ["prescription", "medicine", "rx", "medication", "drug"];
    if (rxKeywords.some((kw) => content.includes(kw))) {
      return "prescription-reader";
    }
    // Default for images: OCR agent
    return "medical-ocr";
  }

  // Priority 3: PDF attachments
  if (hasPdfAttachment) {
    return "report-analyzer";
  }

  // Priority 4: Keyword-based routing for text queries
  const skillScores: { skill: MedicalSkillType; score: number }[] = [];

  for (const skill of MEDICAL_SKILLS) {
    if (skill.id === "general" || skill.id === "followup-generator") continue;
    if (skill.id === "emergency-detector") continue; // Already checked

    let score = 0;
    for (const trigger of skill.triggers) {
      if (content.includes(trigger)) {
        score += trigger.split(" ").length; // Multi-word triggers score higher
      }
    }

    if (score > 0) {
      skillScores.push({ skill: skill.id, score });
    }
  }

  // Return highest scoring skill, or general if no matches
  if (skillScores.length > 0) {
    skillScores.sort((a, b) => b.score - a.score);
    return skillScores[0].skill;
  }

  return "general";
}

/** Get skill metadata for display */
export function getSkillInfo(skillId: MedicalSkillType) {
  return MEDICAL_SKILLS.find((s) => s.id === skillId);
}
