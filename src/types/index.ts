export type Category = 'history' | 'geography' | 'entertainment';

export type Difficulty = 'easy' | 'intermediate' | 'expert';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  category: Category;
  difficulty: Difficulty;
}

export interface QuestionsData {
  history: {
    easy: Question[];
    intermediate: Question[];
    expert: Question[];
  };
  geography: {
    easy: Question[];
    intermediate: Question[];
    expert: Question[];
  };
  entertainment: {
    easy: Question[];
    intermediate: Question[];
    expert: Question[];
  };
} 