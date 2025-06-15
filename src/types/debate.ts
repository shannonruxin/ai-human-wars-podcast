
export interface Speaker {
  id: string;
  name: string;
  avatarSeed: string; // To generate a consistent placeholder avatar
  role?: 'debater' | 'moderator';
  promptConfig?: {
    instructions: string;
    personality: string;
    origin: string;
    beliefAgree: string[];
    beliefDisagree: string[];
    style: string;
  };
  triggerWords?: string[];
  interruptionProbability?: number;
  voiceId?: string; // For future TTS
  color: string; // For UI theming, like the speaking indicator
}

export interface Message {
  id: string;
  speakerId: string;
  text: string;
  timestamp: Date;
}

export type DebateTopic = string;
