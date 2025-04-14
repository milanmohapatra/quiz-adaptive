import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Question, Category, Difficulty, QuestionsData } from '../../types';
import questionsData from '../../data/questions.json';
import {
  Container,
  Paper,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  LinearProgress,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { keyframes } from '@mui/system';
import { Category as CategoryType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProgress } from '../../utils/userProgress';

interface PlayerState {
  name: string;
  score: number;
  selectedAnswer: string;
  hasAnswered: boolean;
}

interface Player {
  name: string;
  score: number;
  selectedAnswer: string | null;
  hasAnswered: boolean;
  streak: number;
}

const QUESTIONS_PER_GAME = 10;
const STORED_PLAYER_NAME_KEY = 'quizPlayerName';
const MAX_QUESTION_TIME = 20; // 20 seconds per question
const BASE_POINTS = 100; // Base points for correct answer
const TIME_BONUS_MULTIPLIER = 5; // Points per second remaining
const PERFORMANCE_THRESHOLD_UP = 0.7; // Adjusted for longer game
const PERFORMANCE_THRESHOLD_DOWN = 0.4; // Below 40% to decrease difficulty
const DIFFICULTY_WEIGHTS = {
  easy: { easy: 0.6, intermediate: 0.3, expert: 0.1 }, // Adjusted for more gradual progression
  intermediate: { easy: 0.2, intermediate: 0.5, expert: 0.3 },
  expert: { easy: 0.1, intermediate: 0.3, expert: 0.6 }
};

// Add animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const Quiz: React.FC = () => {
  const { category } = useParams<{ category?: Category }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [showModeDialog, setShowModeDialog] = useState(true);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [player1Name, setPlayer1Name] = useState(() => localStorage.getItem(STORED_PLAYER_NAME_KEY) || '');
  const [player2Name, setPlayer2Name] = useState('');
  const [streak, setStreak] = useState<number>(0);
  const { currentUser } = useAuth();
  
  const [player1] = useState<PlayerState>({
    name: '',
    score: 0,
    selectedAnswer: '',
    hasAnswered: false
  });

  const [player2] = useState<PlayerState>({
    name: '',
    score: 0,
    selectedAnswer: '',
    hasAnswered: false
  });

  const [showAnswer, setShowAnswer] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(MAX_QUESTION_TIME);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('easy');
  const [performanceHistory, setPerformanceHistory] = useState<boolean[]>([]);
  const [difficultyHistory, setDifficultyHistory] = useState<Difficulty[]>(['easy']);

  // Add timer effect
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Auto-submit on time out
            if (!player1.hasAnswered && !isMultiplayer) {
              handleAnswer('', 1);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timerActive, timeRemaining]);

  // Calculate score based on time
  const calculateScore = (isCorrect: boolean, timeSpent: number): number => {
    if (!isCorrect) return 0;
    
    const timeBonus = Math.floor((MAX_QUESTION_TIME - timeSpent) * TIME_BONUS_MULTIPLIER);
    return BASE_POINTS + Math.max(0, timeBonus);
  };

  // Add function to calculate current performance
  const calculatePerformance = (history: boolean[]): number => {
    if (history.length === 0) return 0;
    return history.filter(result => result).length / history.length;
  };

  // Add function to adjust difficulty based on performance
  const adjustDifficulty = (currentPerformance: number, currentDiff: Difficulty): Difficulty => {
    if (currentPerformance >= PERFORMANCE_THRESHOLD_UP) {
      if (currentDiff === 'easy') return 'intermediate';
      if (currentDiff === 'intermediate') return 'expert';
    } else if (currentPerformance <= PERFORMANCE_THRESHOLD_DOWN) {
      if (currentDiff === 'expert') return 'intermediate';
      if (currentDiff === 'intermediate') return 'easy';
    }
    return currentDiff;
  };

  // Add function to select questions based on weighted difficulty
  const selectQuestionsWithWeightedDifficulty = (
    allQuestions: QuestionsData[Category],
    difficulty: Difficulty
  ): Question[] => {
    const weights = DIFFICULTY_WEIGHTS[difficulty];
    const selectedQuestions: Question[] = [];
    
    // Calculate how many questions to take from each difficulty
    const easyCount = Math.round(QUESTIONS_PER_GAME * weights.easy);
    const intermediateCount = Math.round(QUESTIONS_PER_GAME * weights.intermediate);
    const expertCount = QUESTIONS_PER_GAME - easyCount - intermediateCount;

    // Helper function to shuffle and select questions
    const shuffleAndSelect = (questions: Question[], count: number) => {
      return [...questions].sort(() => Math.random() - 0.5).slice(0, count);
    };

    // Select questions from each difficulty level
    if (easyCount > 0) {
      selectedQuestions.push(...shuffleAndSelect(allQuestions.easy, easyCount));
    }
    if (intermediateCount > 0) {
      selectedQuestions.push(...shuffleAndSelect(allQuestions.intermediate, intermediateCount));
    }
    if (expertCount > 0) {
      selectedQuestions.push(...shuffleAndSelect(allQuestions.expert, expertCount));
    }

    // Shuffle the combined questions
    return selectedQuestions.sort(() => Math.random() - 0.5);
  };

  const handleModeSelect = (mode: 'single' | 'multi') => {
    setIsMultiplayer(mode === 'multi');
    if (mode === 'single' && player1Name) {
      // If we have a stored name for single player, skip the name dialog
      handleStartGame();
    } else {
      setShowModeDialog(false);
      setShowNameDialog(true);
    }
  };

  const handleStartGame = () => {
    if (isMultiplayer && (!player1Name.trim() || !player2Name.trim())) {
      setError('Please enter names for both players');
      return;
    }
    if (!isMultiplayer && !player1Name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    const trimmedName = player1Name.trim();
    player1.name = trimmedName;
    
    if (isMultiplayer) {
      player2.name = player2Name.trim();
    } else {
      // Store the name in localStorage for single player mode
      localStorage.setItem(STORED_PLAYER_NAME_KEY, trimmedName);
      player2.name = 'Computer';
    }
    
    setShowModeDialog(false);
    setShowNameDialog(false);
    setTimeRemaining(MAX_QUESTION_TIME);
    setTimerActive(true);
    setQuestionStartTime(Date.now());
    loadQuestions();
  };

  const loadQuestions = () => {
    if (!category) {
      setError('Invalid category');
      return;
    }

    try {
      const allQuestions = (questionsData as unknown as QuestionsData)[category];
      const selected = selectQuestionsWithWeightedDifficulty(allQuestions, currentDifficulty);
      
      setQuestions(selected);
      setCurrentQuestion(selected[0]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading questions:', error);
      setError('Failed to load questions');
    }
  };

  const handleAnswer = async (answer: string, playerNumber: 1 | 2) => {
    if (showAnswer || !currentQuestion || !category) return;

    setTimerActive(false);
    const timeSpent = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : MAX_QUESTION_TIME;
    const isCorrect = answer === currentQuestion.correctAnswer;
    const score = calculateScore(isCorrect, timeSpent);

    // Update performance history
    setPerformanceHistory(prev => [...prev, isCorrect]);
    
    // Adjust difficulty if needed
    const currentPerformance = calculatePerformance([...performanceHistory, isCorrect]);
    const newDifficulty = adjustDifficulty(currentPerformance, currentDifficulty);
    
    if (newDifficulty !== currentDifficulty) {
      setCurrentDifficulty(newDifficulty);
      setDifficultyHistory(prev => [...prev, newDifficulty]);
    }

    if (playerNumber === 1) {
      player1.selectedAnswer = answer;
      player1.hasAnswered = true;
      if (isCorrect) {
        player1.score += score;
        playCorrectSound();
        setStreak(prev => prev + 1);
      } else {
        setStreak(0);
      }
      
      if (!isMultiplayer) {
        setShowAnswer(true);
        setTimeout(() => {
          const computerAnswer = currentQuestion.options[Math.floor(Math.random() * currentQuestion.options.length)];
          player2.selectedAnswer = computerAnswer;
          player2.hasAnswered = true;
          if (computerAnswer === currentQuestion.correctAnswer) {
            // Computer gets random score between 50-100% of max possible score
            const computerScore = Math.floor((BASE_POINTS + (MAX_QUESTION_TIME * TIME_BONUS_MULTIPLIER)) * (0.5 + Math.random() * 0.5));
            player2.score += computerScore;
          }
        }, 300);
      }
    } else {
      player2.selectedAnswer = answer;
      player2.hasAnswered = true;
      if (isCorrect) player2.score += score;
    }

    // For multiplayer, or if it's player 2's move
    if (isMultiplayer) {
      setShowAnswer(true);
    }

    // Update user progress only if we have a logged in user
    if (currentUser?.uid) {
      await updateUserProgress(
        currentUser.uid,
        category,
        currentQuestion.difficulty,
        isCorrect,
        streak
      );
    }
  };

  const handleNextQuestion = () => {
    const nextQuestionIndex = currentQuestionIndex + 1;
    
    if (nextQuestionIndex >= QUESTIONS_PER_GAME) {
      setGameOver(true);
      return;
    }

    // Set up the next question before updating the index
    const nextQuestion = questions[nextQuestionIndex];
    if (!nextQuestion) {
      console.error('Next question not found');
      setGameOver(true);
      return;
    }

    setCurrentQuestion(nextQuestion);
    setCurrentQuestionIndex(nextQuestionIndex);
    
    // Reset player states
    player1.selectedAnswer = '';
    player1.hasAnswered = false;
    player2.selectedAnswer = '';
    player2.hasAnswered = false;
    
    // Reset question states
    setShowAnswer(false);
    setTimeRemaining(MAX_QUESTION_TIME);
    setTimerActive(true);
    setQuestionStartTime(Date.now());
  };

  const getFunnyComment = () => {
    if (player1.score === player2.score) {
      return "It's a tie! You two share the same brain cells! 🧠🤝";
    } else if (player1.score > player2.score) {
      return `${player1.name} wins! ${player2.name}, maybe try using Google next time? 😜`;
    } else {
      return `${player2.name} wins! ${player1.name}, don't worry - being second just means you're the first loser! 😄`;
    }
  };

  const playCorrectSound = () => {
    const audio = new Audio('/sounds/correct.mp3');
    audio.play().catch(error => console.log('Error playing sound:', error));
  };

  const getPersona = (score: number): { title: string; description: string; emoji: string } => {
    const maxPossibleScore = QUESTIONS_PER_GAME * (BASE_POINTS + (MAX_QUESTION_TIME * TIME_BONUS_MULTIPLIER));
    const percentage = (score / maxPossibleScore) * 100;

    if (percentage >= 90) {
      return {
        title: "Quiz Master",
        description: "You're not just smart, you're lightning fast! Your brain processes information faster than a quantum computer.",
        emoji: "🧠✨"
      };
    } else if (percentage >= 80) {
      return {
        title: "Speed Sage",
        description: "Quick thinking and accurate answers - you're what every quiz show host dreams of!",
        emoji: "⚡️🎯"
      };
    } else if (percentage >= 70) {
      return {
        title: "Knowledge Ninja",
        description: "Silent but deadly accurate. You strike the right answers with precision!",
        emoji: "🥷🎓"
      };
    } else if (percentage >= 60) {
      return {
        title: "Rising Star",
        description: "You're getting there! With a bit more practice, you'll be unstoppable.",
        emoji: "⭐️📚"
      };
    } else if (percentage >= 50) {
      return {
        title: "Curious Explorer",
        description: "Every question is a new adventure for you. Keep that curiosity burning!",
        emoji: "🔍🌟"
      };
    } else if (percentage >= 30) {
      return {
        title: "Brave Apprentice",
        description: "Hey, you're here to learn, and that's what matters! Keep pushing forward.",
        emoji: "🌱💪"
      };
    } else {
      return {
        title: "Quiz Rookie",
        description: "Everyone starts somewhere! Your journey to becoming a quiz master begins today.",
        emoji: "🐣🎮"
      };
    }
  };

  // Add difficulty indicator component
  const renderDifficultyIndicator = () => (
    <Box sx={{ 
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      mb: 2
    }}>
      <Typography variant="body1" color="text.secondary">
        Current Difficulty:
      </Typography>
      <Chip
        label={currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}
        color={
          currentDifficulty === 'easy' ? 'success' :
          currentDifficulty === 'intermediate' ? 'warning' : 'error'
        }
        sx={{ fontWeight: 'bold' }}
      />
    </Box>
  );

  // Modify the game over screen to show difficulty progression
  const renderDifficultyProgression = () => (
    <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Your Difficulty Progression
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {difficultyHistory.map((diff, index) => (
          <Chip
            key={index}
            label={diff.charAt(0).toUpperCase() + diff.slice(1)}
            color={
              diff === 'easy' ? 'success' :
              diff === 'intermediate' ? 'warning' : 'error'
            }
            size="small"
          />
        ))}
      </Box>
    </Box>
  );

  if (showModeDialog) {
    return (
      <Container maxWidth="sm">
        <Dialog open={showModeDialog} onClose={() => navigate('/')} maxWidth="sm" fullWidth>
          <DialogTitle>Select Game Mode</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleModeSelect('single')}
                sx={{ width: '150px', height: '100px' }}
              >
                Single Player
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => handleModeSelect('multi')}
                sx={{ width: '150px', height: '100px' }}
              >
                Two Players
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => navigate('/')}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  if (showNameDialog) {
    return (
      <Container maxWidth="sm">
        <Dialog open={showNameDialog} onClose={() => navigate('/')} maxWidth="sm" fullWidth>
          <DialogTitle>{isMultiplayer ? 'Enter Player Names' : 'Enter Your Name'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                autoFocus
                fullWidth
                label={isMultiplayer ? "Player 1 Name" : "Your Name"}
                value={player1Name}
                onChange={(e) => setPlayer1Name(e.target.value)}
                sx={{ mb: 2 }}
              />
              {isMultiplayer && (
                <TextField
                  fullWidth
                  label="Player 2 Name"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                />
              )}
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowModeDialog(true)}>Back</Button>
            <Button onClick={() => navigate('/')}>Cancel</Button>
            <Button onClick={handleStartGame} variant="contained" color="primary">
              Start Game
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <LinearProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (gameOver) {
    return (
      <Box sx={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ 
          width: '100%',
          maxWidth: '600px',
          px: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Paper 
            elevation={6} 
            sx={{ 
              p: 4,
              width: '100%',
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3
            }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  textAlign: 'center'
                }}
              >
                🎉 Quiz Complete! 🎉
              </Typography>
              
              {!isMultiplayer ? (
                <>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: 'primary.main',
                      fontWeight: 500,
                      textAlign: 'center'
                    }}
                  >
                    Congratulations, {player1.name}!
                  </Typography>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    width: '100%'
                  }}>
                    <Typography variant="h5" sx={{ color: 'text.secondary' }}>
                      Your Final Score
                    </Typography>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 3,
                      borderRadius: 2,
                      backgroundColor: 'primary.light',
                    }}>
                      <Typography 
                        variant="h2" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: 'primary.main'
                        }}
                      >
                        {player1.score}
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'text.secondary' }}>
                        / {QUESTIONS_PER_GAME * (BASE_POINTS + (MAX_QUESTION_TIME * TIME_BONUS_MULTIPLIER))}
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                      Maximum possible score: {QUESTIONS_PER_GAME * (BASE_POINTS + (MAX_QUESTION_TIME * TIME_BONUS_MULTIPLIER))} points
                    </Typography>
                  </Box>

                  <Box sx={{
                    width: '100%',
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    animation: `${fadeIn} 0.6s ease-out`
                  }}>
                    {(() => {
                      const persona = getPersona(player1.score);
                      return (
                        <>
                          <Typography variant="h4" sx={{ mb: 2, color: 'primary.main' }}>
                            {persona.emoji} {persona.title} {persona.emoji}
                          </Typography>
                          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                            {persona.description}
                          </Typography>
                        </>
                      );
                    })()}
                  </Box>
                </>
              ) : (
                <>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 500,
                      textAlign: 'center',
                      mb: 3
                    }}
                  >
                    Final Scores
                  </Typography>
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 3,
                    width: '100%'
                  }}>
                    {[player1, player2].map((player, index) => (
                      <Paper 
                        key={index}
                        elevation={3}
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          backgroundColor: index === 0 ? 'primary.light' : 'secondary.light',
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="h5" sx={{ color: index === 0 ? 'primary.main' : 'secondary.main', mb: 2 }}>
                          {player.name}
                        </Typography>
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: index === 0 ? 'primary.dark' : 'secondary.dark'
                          }}
                        >
                          {player.score}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>

                  <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', mt: 2 }}>
                    Maximum possible score: {QUESTIONS_PER_GAME * (BASE_POINTS + (MAX_QUESTION_TIME * TIME_BONUS_MULTIPLIER))} points
                  </Typography>

                  <Alert 
                    severity="info" 
                    sx={{ 
                      width: '100%',
                      '& .MuiAlert-message': {
                        width: '100%'
                      }
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        textAlign: 'center',
                        fontWeight: 'normal'
                      }}
                    >
                      {getFunnyComment()}
                    </Typography>
                  </Alert>

                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 3,
                    width: '100%'
                  }}>
                    {[player1, player2].map((player, index) => {
                      const persona = getPersona(player.score);
                      return (
                        <Paper
                          key={index}
                          elevation={3}
                          sx={{
                            p: 3,
                            borderRadius: 2,
                            backgroundColor: index === 0 ? 'primary.light' : 'secondary.light',
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="h6" sx={{ color: index === 0 ? 'primary.main' : 'secondary.main', mb: 1 }}>
                            {persona.emoji} {persona.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {persona.description}
                          </Typography>
                        </Paper>
                      );
                    })}
                  </Box>
                </>
              )}

              <Button
                variant="contained"
                color="primary"
                component={Link}
                to="/"
                startIcon={<HomeIcon />}
                sx={{ 
                  py: 1.5,
                  px: 4,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  textTransform: 'none',
                  mt: 2
                }}
              >
                Play Again
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  }

  // Add timer display component
  const renderTimer = () => (
    <Box sx={{ 
      width: '100%',
      mb: 3,
      display: 'flex',
      flexDirection: 'column',
      gap: 1
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" color={timeRemaining <= 5 ? 'error' : 'text.secondary'}>
          Time Remaining: {timeRemaining}s
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Possible Points: {BASE_POINTS + (timeRemaining * TIME_BONUS_MULTIPLIER)}
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={(timeRemaining / MAX_QUESTION_TIME) * 100}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            backgroundColor: timeRemaining <= 5 ? 'error.main' : 'success.main',
            transition: 'transform 1s linear'
          }
        }}
      />
    </Box>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 2
    }}>
      <Box sx={{ 
        width: '100%', 
        maxWidth: '600px',
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: 'calc(100vh - 32px)', // Account for vertical padding
        position: 'relative'
      }}>
        {/* Header Section - Fixed Height */}
        <Box sx={{ flexShrink: 0 }}>
          {!isMultiplayer && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              width: '100%',
              mb: 2
            }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 'bold',
                  color: 'primary.main'
                }}
              >
                {category ? `${category.charAt(0).toUpperCase()}${category.slice(1)} Quiz` : 'Quiz'}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                backgroundColor: 'background.paper',
                p: 1,
                borderRadius: 2,
                boxShadow: 1
              }}>
                <Typography variant="body1">
                  {currentQuestionIndex + 1}/{QUESTIONS_PER_GAME}
                </Typography>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                  {player1.score}
                </Typography>
              </Box>
            </Box>
          )}

          {renderTimer()}
        </Box>

        {/* Question Section - Fixed Height */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            borderRadius: 2,
            backgroundColor: 'background.paper',
            position: 'relative'
          }}
        >
          {currentQuestion ? (
            <>
              <Typography 
                variant="h5" 
                sx={{ 
                  textAlign: 'center',
                  fontWeight: 500,
                  color: 'text.primary',
                  mb: 1
                }}
              >
                {currentQuestion.question}
              </Typography>

              <RadioGroup
                value={player1.selectedAnswer}
                onChange={(e) => handleAnswer(e.target.value, 1)}
                sx={{ width: '100%' }}
              >
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  width: '100%'
                }}>
                  {currentQuestion.options.map((option: string) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={<Radio />}
                      label={option}
                      disabled={player1.hasAnswered || showAnswer}
                      sx={{
                        m: 0,
                        width: '100%',
                        backgroundColor: showAnswer
                          ? option === currentQuestion.correctAnswer
                            ? 'success.light'
                            : option === player1.selectedAnswer
                            ? 'error.light'
                            : 'transparent'
                          : 'transparent',
                        p: 1.5,
                        borderRadius: 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          transform: 'translateY(-2px)',
                          boxShadow: 1
                        }
                      }}
                    />
                  ))}
                </Box>
              </RadioGroup>
            </>
          ) : (
            <Typography variant="body1">Loading question...</Typography>
          )}
        </Paper>

        {/* Answer Section - Fixed Position */}
        {showAnswer && currentQuestion && (
          <Paper 
            elevation={3} 
            sx={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              mx: 2,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              borderRadius: 2,
              backgroundColor: player1.selectedAnswer === currentQuestion.correctAnswer 
                ? 'success.light' 
                : 'info.light',
              animation: `${fadeIn} 0.3s ease-out`,
              zIndex: 10
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                color: player1.selectedAnswer === currentQuestion.correctAnswer 
                  ? 'success.dark' 
                  : 'info.dark',
                textAlign: 'center'
              }}
            >
              {player1.selectedAnswer === currentQuestion.correctAnswer 
                ? "🎉 Excellent!" 
                : "💡 Learning Moment"}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: player1.selectedAnswer === currentQuestion.correctAnswer 
                  ? 'success.dark' 
                  : 'info.dark',
                textAlign: 'center'
              }}
            >
              {player1.selectedAnswer === currentQuestion.correctAnswer 
                ? "That's correct!" 
                : `The correct answer is: ${currentQuestion.correctAnswer}`}
            </Typography>

            <Button
              variant="contained"
              color={player1.selectedAnswer === currentQuestion.correctAnswer ? "success" : "primary"}
              onClick={handleNextQuestion}
              size="large"
              sx={{
                px: 4,
                py: 1,
                borderRadius: 2,
                minWidth: '200px'
              }}
            >
              {currentQuestionIndex + 1 >= QUESTIONS_PER_GAME ? "See Results" : "Next Question"}
            </Button>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default Quiz; 