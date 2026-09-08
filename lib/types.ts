export type JournalMode = 'reflection' | 'summary' | 'brainstorm' | 'dialogue' | 'freeform' | 'devlog';

export interface TurnMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  modelUsed?: string;
  dualResponse?: DualCognitiveResponse;
}

export interface DualCognitiveResponse {
  original_log_summary: string;
  reflection_mode_active: string;
  socratic_response_markdown: string | null;
  linkedin_optimized_post: string | null;
  data_storage_directive?: string;
  internal_tags?: string[];
  ai_thematic_analysis?: {
    dominant_mindset: string;
    resonance_level: string;
    skills_or_themes_demonstrated: string[];
  };
  internal_firestore_tags?: string[];
}

export interface JournalInteraction {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  title: string;
  mode: JournalMode;
  turns: TurnMessage[];
  summary?: string;
  keyTakeaways?: string[];
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  isFavorite?: boolean;
  latestDualResponse?: DualCognitiveResponse;
}

export interface ReflectRequestPayload {
  prompt: string;
  mode?: JournalMode;
  history?: Array<{
    role: 'user' | 'model';
    text: string;
  }>;
  existingSummary?: string;
}

export interface ReflectResponsePayload {
  reply: string;
  summary?: string;
  keyTakeaways?: string[];
  modelUsed: string;
  dualResponse?: DualCognitiveResponse;
}
