export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  avatar_url?: string;
  is_active: boolean;
  is_email_confirmed: boolean;
  group_id?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  module_id: string;
  title: string;
  content: string;
  order: number;
  has_test: boolean;
  has_lab: boolean;
  passing_score: number;
  time_limit?: number;
  created_at: string;
  updated_at: string;
}

export interface TopicWithProgress extends Topic {
  progress_status: 'not_started' | 'in_progress' | 'completed';
  best_score?: number;
}

export interface TestQuestion {
  id: string;
  type: 'single' | 'multiple' | 'matching' | 'text';
  text: string;
  options?: { id: string; text: string }[];
  matching_terms?: { id: string; text: string }[];
  matching_definitions?: { id: string; text: string }[];
}

export interface Test {
  id: string;
  topic_id: string;
  questions: TestQuestion[];
  passing_score: number;
  time_limit?: number;
}

export interface TestResult {
  attempt_id: string;
  total_score: number;
  percentage: number;
  passed: boolean;
  passed_score: number;
  time_spent: number;
  details: TestResultDetail[];
  topic_id: string;
  created_at: string;
}

export interface TestResultDetail {
  question_id: string;
  type: string;
  correct: boolean;
  user_answer: any;
  correct_answer: any;
}

export interface TestAttempt {
  id: string;
  topic_id: string;
  score: number;
  percentage: number;
  passed: boolean;
  time_spent: number;
  created_at: string;
}

export interface Lab {
  id: string;
  topic_id: string;
  title: string;
  description: string;
  requirements: string[];
  max_score: number;
  allowed_extensions: string[];
  created_at: string;
}

export interface LabSubmission {
  id: string;
  lab_id: string;
  user_id: string;
  file_name: string;
  status: 'pending' | 'approved' | 'needs_revision';
  grade?: number;
  feedback?: string;
  submitted_at: string;
  graded_at?: string;
  topic_title?: string;
}

export interface TeacherLabSubmission extends LabSubmission {
  student_name: string;
  student_email: string;
  topic_title: string;
  lab_title: string;
}

export interface Progress {
  total_topics: number;
  completed_topics: number;
  in_progress_topics: number;
  percentage: number;
  modules: ModuleProgress[];
}

export interface ModuleProgress {
  id: string;
  title: string;
  total_topics: number;
  completed_topics: number;
  in_progress_topics: number;
  topics?: TopicProgressSummary[];
}

export interface TopicProgressSummary {
  id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  best_score?: number | null;
}

export interface TopicStats {
  topic_id: string;
  topic_title: string;
  module_title: string;
  best_score?: number;
  attempts: number;
  last_attempt?: string;
}

export interface StudentStats {
  total_topics: number;
  completed_topics: number;
  average_score: number;
  total_tests_taken: number;
  labs_completed: number;
  labs_pending: number;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  topic_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}
