
export interface Speaker {
  id: string;
  name: string;
  avatarSeed: string; // To generate a consistent placeholder avatar
  promptConfig?: {
    instructions: string;
    personality: string;
    beliefAgree: string[];
    beliefDisagree: string[];
    style: string;
  };
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
