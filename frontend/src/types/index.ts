export interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
}

export interface InterviewConfig {
  resumeText?: string;
  feishuLink?: string;
  difficulty?: '白菜' | 'SP' | 'SSP';
  model?: string;
  direction?: 'embedded' | 'embodied';
}

export interface SessionInfo {
  session_id: string;
  direction: string;
  difficulty: string;
  question_count: number;
  topics_covered: string[];
  is_finished: boolean;
  message_count: number;
}

export interface ReportData {
  report: string;
  session_id: string;
}
