export type Difficulty = 'easy' | 'intermediate' | 'expert' | 'legendary';

export type Category = 'history' | 'sports' | 'mythology' | 'politics' | 'bollywood' | 'science';

export interface Question {
  id: string;
  category: Category;
  difficulty: Difficulty;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  hint?: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  category: Category;
  difficulty: Difficulty;
  score: number;
  questionsAnswered: number;
  timestamp: Date;
  correctAnswers: number;
}

export interface UserProgress {
  userId: string;
  displayName: string;
  totalScore: number;
  questionsAnswered: number;
  categoryProgress: {
    [key in Category]?: {
      level: Difficulty;
      score: number;
      questionsAnswered: number;
      correctAnswers: number;
    };
  };
  achievements: string[];
} 