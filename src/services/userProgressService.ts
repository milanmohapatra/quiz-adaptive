import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Category, Difficulty, UserProgress } from '../types/quiz';
import { getAuth } from 'firebase/auth';

const ACHIEVEMENTS = {
  FIRST_CORRECT: {
    id: 'first_correct',
    title: 'First Steps',
    description: 'Answer your first question correctly'
  },
  PERFECT_ROUND: {
    id: 'perfect_round',
    title: 'Perfect Round',
    description: 'Answer 5 questions correctly in a row'
  },
  MASTER_CATEGORY: {
    id: 'master_category',
    title: 'Category Master',
    description: 'Reach expert level in any category'
  },
  LEGENDARY: {
    id: 'legendary',
    title: 'Legendary Status',
    description: 'Reach legendary difficulty in any category'
  }
};

export const initializeUserProgress = async (userId: string) => {
  const userRef = doc(db, 'userProgress', userId);
  const userDoc = await getDoc(userRef);

  // Get user's display name from Firebase Auth
  const auth = getAuth();
  const user = auth.currentUser;
  const displayName = user?.displayName || 'Anonymous Player';

  if (!userDoc.exists()) {
    const initialProgress: UserProgress = {
      userId,
      displayName,
      totalScore: 0,
      questionsAnswered: 0,
      categoryProgress: {},
      achievements: []
    };
    await setDoc(userRef, initialProgress);
    return initialProgress;
  }

  // Update display name if it has changed
  if (userDoc.data().displayName !== displayName) {
    await updateDoc(userRef, { displayName });
  }

  return userDoc.data() as UserProgress;
};

export const updateUserProgress = async (
  userId: string,
  category: Category,
  difficulty: Difficulty,
  isCorrect: boolean,
  currentStreak: number
) => {
  const userRef = doc(db, 'userProgress', userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data() as UserProgress;

  // Update category progress
  const categoryProgress = userData.categoryProgress[category] || {
    level: 'easy' as Difficulty,
    score: 0,
    questionsAnswered: 0,
    correctAnswers: 0
  };

  categoryProgress.questionsAnswered++;
  if (isCorrect) {
    categoryProgress.correctAnswers++;
    categoryProgress.score += getDifficultyPoints(difficulty);
  }

  // Check for achievements
  const newAchievements = [...userData.achievements];

  if (isCorrect && !userData.achievements.includes(ACHIEVEMENTS.FIRST_CORRECT.id)) {
    newAchievements.push(ACHIEVEMENTS.FIRST_CORRECT.id);
  }

  if (currentStreak >= 5 && !userData.achievements.includes(ACHIEVEMENTS.PERFECT_ROUND.id)) {
    newAchievements.push(ACHIEVEMENTS.PERFECT_ROUND.id);
  }

  if (difficulty === 'expert' && !userData.achievements.includes(ACHIEVEMENTS.MASTER_CATEGORY.id)) {
    newAchievements.push(ACHIEVEMENTS.MASTER_CATEGORY.id);
  }

  if (difficulty === 'legendary' && !userData.achievements.includes(ACHIEVEMENTS.LEGENDARY.id)) {
    newAchievements.push(ACHIEVEMENTS.LEGENDARY.id);
  }

  // Update user document
  await updateDoc(userRef, {
    totalScore: userData.totalScore + (isCorrect ? getDifficultyPoints(difficulty) : 0),
    questionsAnswered: userData.questionsAnswered + 1,
    [`categoryProgress.${category}`]: categoryProgress,
    achievements: newAchievements
  });

  return newAchievements.filter(id => !userData.achievements.includes(id));
};

const getDifficultyPoints = (difficulty: Difficulty): number => {
  switch (difficulty) {
    case 'easy': return 10;
    case 'intermediate': return 20;
    case 'expert': return 35;
    case 'legendary': return 50;
  }
}; 