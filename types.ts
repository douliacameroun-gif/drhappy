
export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  role: Role;
  text: string;
  timestamp: Date;
}

export interface AuditReport {
  dailyLife: string;
  painPoints: string[];
  personalChallenges: string;
  priorityFeature: string;
  timeGain: string;
  serviceImpact: string;
  technicalComplexity: 'Bas' | 'Moyen' | 'Élevé';
  recommendedModel: string;
  budgetNote: string;
}

export interface AppState {
  messages: Message[];
  isThinking: boolean;
  auditStep: number;
  isReportGenerated: boolean;
}
