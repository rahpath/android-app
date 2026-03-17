export type JourneyQuestion = {
  id: string;
  question: string;
  category: string;
};

export const journeyQuestions: JourneyQuestion[] = [
  {
    id: "recent_weight",
    question: "What has been weighing on you recently?",
    category: "emotional_weight",
  },
  {
    id: "life_change",
    question: "What life change are you currently navigating?",
    category: "life_transition",
  },
  {
    id: "relationship_pattern",
    question: "What relationship patterns keep repeating?",
    category: "relationship_pattern",
  },
  {
    id: "shaping_moment",
    question: "What moments shaped how you see yourself?",
    category: "identity_story",
  },
  {
    id: "current_inquiry",
    question: "What are you trying to understand about your life right now?",
    category: "inner_inquiry",
  },
];
