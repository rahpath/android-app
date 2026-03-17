export type FollowUpQuestionType = "chips" | "short_text";

export type FollowUpQuestion = {
  id: string;
  question: string;
  type: FollowUpQuestionType;
  category: string;
  options?: Array<{
    label: string;
    value: string;
  }>;
  placeholder?: string;
};

export const followUpQuestionPool: FollowUpQuestion[] = [
  {
    id: "emotional_weight",
    category: "emotion",
    type: "chips",
    question: "What part of this is hurting the most?",
    options: [
      { label: "Uncertainty", value: "uncertainty" },
      { label: "Rejection", value: "rejection" },
      { label: "Pressure", value: "pressure" },
      { label: "Loneliness", value: "loneliness" },
      { label: "Shame", value: "shame" },
    ],
  },
  {
    id: "fear_outcome",
    category: "fear",
    type: "short_text",
    question: "What are you scared might happen if this does not change?",
    placeholder: "One honest sentence is enough",
  },
  {
    id: "control_gap",
    category: "agency",
    type: "chips",
    question: "Which part feels most out of your control?",
    options: [
      { label: "Other people", value: "other_people" },
      { label: "Timing", value: "timing" },
      { label: "My own mind", value: "my_own_mind" },
      { label: "Money", value: "money" },
      { label: "Direction", value: "direction" },
    ],
  },
  {
    id: "relationship_role",
    category: "relationships",
    type: "chips",
    question: "When this happens, what role do you slip into?",
    options: [
      { label: "Over-giver", value: "over_giver" },
      { label: "Fixer", value: "fixer" },
      { label: "Avoider", value: "avoider" },
      { label: "Overthinker", value: "overthinker" },
      { label: "Peacemaker", value: "peacemaker" },
    ],
  },
  {
    id: "decision_pressure",
    category: "decision",
    type: "short_text",
    question: "If you had to decide something soon, what would it be?",
    placeholder: "Short and direct works",
  },
  {
    id: "what_tried",
    category: "effort",
    type: "short_text",
    question: "What have you already tried that did not fully fix this?",
    placeholder: "Keep it simple",
  },
  {
    id: "validation_need",
    category: "need",
    type: "chips",
    question: "What are you secretly hoping Rah confirms for you?",
    options: [
      { label: "That I’m not crazy", value: "not_crazy" },
      { label: "That I should let go", value: "let_go" },
      { label: "That timing matters", value: "timing_matters" },
      { label: "That I need to act", value: "need_to_act" },
      { label: "That I deserve more", value: "deserve_more" },
    ],
  },
  {
    id: "pattern_familiarity",
    category: "pattern",
    type: "chips",
    question: "Does this feel new, or painfully familiar?",
    options: [
      { label: "Very familiar", value: "very_familiar" },
      { label: "Kind of repeating", value: "kind_of_repeating" },
      { label: "Mostly new", value: "mostly_new" },
    ],
  },
];

export function getFollowUpQuestionById(id: string) {
  return followUpQuestionPool.find((question) => question.id === id) ?? null;
}
