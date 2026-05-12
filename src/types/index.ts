export interface InterviewQuestion {
  id: string;
  question: string;
  timestamp: Date;
  answer?: string;
  category?: string;
  confidence?: number;
  isProcessing?: boolean;
}

export interface InterviewSession {
  id: string;
  title: string;
  role: string;
  techStack: string[];
  questions: InterviewQuestion[];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
}

export interface UserSettings {
  apiKey: string;
  aiModel: string;
  language: string;
  responseSpeed: 'fast' | 'balanced' | 'detailed';
  stealthMode: boolean;
  autoListen: boolean;
  dualVoiceMode: boolean;
  role: string;
  experience: string;
  techStack: string[];
}

export interface AppState {
  isListening: boolean;
  isProcessing: boolean;
  currentTranscript: string;
  stealthMode: boolean;
  screenShareDetected: boolean;
}
