import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Question, Category, Difficulty } from '../../types/quiz';
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
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { keyframes } from '@mui/system';

type QuestionsData = {
  [key in Category]: {
    [key in Difficulty]: Question[]
  }
};

interface PlayerState {
  name: string;
  score: number;
  selectedAnswer: string;
  hasAnswered: boolean;
}

const QUESTIONS_PER_GAME = 5;
const STORED_PLAYER_NAME_KEY = 'quizPlayerName';

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

export default function Quiz() {
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
    loadQuestions();
  };

  const loadQuestions = () => {
    if (!category) {
      setError('Invalid category');
      return;
    }

    try {
      // Get questions from JSON
      const allQuestions = (questionsData as QuestionsData)[category].easy;
      
      // Randomly select QUESTIONS_PER_GAME questions
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, QUESTIONS_PER_GAME);
      
      setQuestions(selected);
      setLoading(false);
    } catch (error) {
      console.error('Error loading questions:', error);
      setError('Failed to load questions');
    }
  };

  const handleAnswer = (answer: string, playerNumber: 1 | 2) => {
    if (showAnswer) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;

    if (playerNumber === 1) {
      player1.selectedAnswer = answer;
      player1.hasAnswered = true;
      if (isCorrect) player1.score++;
      
      // In single player mode, show answer immediately
      if (!isMultiplayer) {
        setShowAnswer(true);
        // Handle computer's move in the background
        setTimeout(() => {
          const computerAnswer = currentQuestion.options[Math.floor(Math.random() * currentQuestion.options.length)];
          player2.selectedAnswer = computerAnswer;
          player2.hasAnswered = true;
          if (computerAnswer === currentQuestion.correctAnswer) player2.score++;
        }, 300);
      }
    } else {
      player2.selectedAnswer = answer;
      player2.hasAnswered = true;
      if (isCorrect) player2.score++;
    }

    // For multiplayer, or if it's player 2's move
    if (isMultiplayer) {
      setShowAnswer(true);
      setTimeout(() => {
        handleNextQuestion();
      }, 2000);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 >= QUESTIONS_PER_GAME) {
      setGameOver(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      player1.selectedAnswer = '';
      player1.hasAnswered = false;
      player2.selectedAnswer = '';
      player2.hasAnswered = false;
      setShowAnswer(false);
    }
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
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              🎉 Quiz Complete! 🎉
            </Typography>
            
            <Box sx={{ my: 4 }}>
              {!isMultiplayer ? (
                <>
                  <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
                    Congratulations, {player1.name}!
                  </Typography>
                  <Typography variant="h4" sx={{ my: 3 }}>
                    Your Score: {player1.score} out of {QUESTIONS_PER_GAME}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h5" gutterBottom>
                    Final Scores:
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {player1.name}: {player1.score} points
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 4 }}>
                    {player2.name}: {player2.score} points
                  </Typography>
                  <Alert severity="info" sx={{ mb: 4 }}>
                    <Typography variant="body1">
                      {getFunnyComment()}
                    </Typography>
                  </Alert>
                </>
              )}
            </Box>

            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/"
              startIcon={<HomeIcon />}
              sx={{ width: '100%', py: 1.5 }}
            >
              Play Again
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Question {currentQuestionIndex + 1} of {QUESTIONS_PER_GAME}
      </Typography>

      {isMultiplayer ? (
        // Multiplayer split screen
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* Player 1's Side */}
          <Box sx={{ flex: 1 }}>
            <Paper elevation={3} 
              sx={{ 
                p: 3,
                border: '2px solid',
                borderColor: player1.hasAnswered ? 'primary.main' : 'grey.300'
              }}
            >
              <Typography variant="h5" gutterBottom color="primary">
                {player1.name}'s Screen
              </Typography>
              <Typography variant="h6" gutterBottom>
                Score: {player1.score}
              </Typography>
              
              <Typography variant="h6" sx={{ mb: 2 }}>
                {currentQuestion.question}
              </Typography>

              <RadioGroup
                value={player1.selectedAnswer}
                onChange={(e) => handleAnswer(e.target.value, 1)}
              >
                {currentQuestion.options.map((option) => (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio />}
                    label={option}
                    disabled={player1.hasAnswered || showAnswer}
                    sx={{
                      backgroundColor: showAnswer
                        ? option === currentQuestion.correctAnswer
                          ? 'success.light'
                          : option === player1.selectedAnswer
                          ? 'error.light'
                          : 'transparent'
                        : 'transparent',
                      p: 1,
                      borderRadius: 1,
                      mb: 1
                    }}
                  />
                ))}
              </RadioGroup>
            </Paper>
          </Box>

          {/* Player 2's Side */}
          <Box sx={{ flex: 1 }}>
            <Paper elevation={3}
              sx={{ 
                p: 3,
                border: '2px solid',
                borderColor: player2.hasAnswered ? 'secondary.main' : 'grey.300'
              }}
            >
              <Typography variant="h5" gutterBottom color="secondary">
                {player2.name}'s Screen
              </Typography>
              <Typography variant="h6" gutterBottom>
                Score: {player2.score}
              </Typography>
              
              <Typography variant="h6" sx={{ mb: 2 }}>
                {currentQuestion.question}
              </Typography>

              <RadioGroup
                value={player2.selectedAnswer}
                onChange={(e) => handleAnswer(e.target.value, 2)}
              >
                {currentQuestion.options.map((option) => (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio />}
                    label={option}
                    disabled={player2.hasAnswered || showAnswer}
                    sx={{
                      backgroundColor: showAnswer
                        ? option === currentQuestion.correctAnswer
                          ? 'success.light'
                          : option === player2.selectedAnswer
                          ? 'error.light'
                          : 'transparent'
                        : 'transparent',
                      p: 1,
                      borderRadius: 1,
                      mb: 1
                    }}
                  />
                ))}
              </RadioGroup>
            </Paper>
          </Box>
        </Box>
      ) : (
        // Enhanced single player mode
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4,
            animation: `${fadeIn} 0.3s ease-out`,
            transition: 'all 0.3s ease'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mb: 3,
            alignItems: 'center'
          }}>
            <Typography variant="h5" color="primary">
              {player1.name}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              animation: player1.hasAnswered && showAnswer ? `${pulse} 0.5s ease` : 'none'
            }}>
              <Typography variant="h6" color="text.secondary">
                Score:
              </Typography>
              <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {player1.score}
              </Typography>
            </Box>
          </Box>

          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3,
              animation: `${fadeIn} 0.4s ease-out`,
              lineHeight: 1.4
            }}
          >
            {currentQuestion.question}
          </Typography>

          <RadioGroup
            value={player1.selectedAnswer}
            onChange={(e) => handleAnswer(e.target.value, 1)}
          >
            {currentQuestion.options.map((option, index) => (
              <FormControlLabel
                key={option}
                value={option}
                control={<Radio />}
                label={option}
                disabled={player1.hasAnswered || showAnswer}
                sx={{
                  width: '100%',
                  backgroundColor: showAnswer
                    ? option === currentQuestion.correctAnswer
                      ? 'success.light'
                      : option === player1.selectedAnswer
                      ? 'error.light'
                      : 'transparent'
                    : 'transparent',
                  p: 1.5,
                  borderRadius: 2,
                  mb: 1,
                  transform: 'scale(1)',
                  animation: `${fadeIn} ${0.2 + index * 0.1}s ease-out`,
                  '&:hover': !player1.hasAnswered && !showAnswer ? {
                    backgroundColor: 'action.hover',
                    transform: 'scale(1.01)',
                    boxShadow: 1
                  } : {},
                  transition: 'all 0.2s ease',
                  border: '1px solid',
                  borderColor: 'divider',
                  '& .MuiTypography-root': {
                    fontWeight: showAnswer && option === currentQuestion.correctAnswer ? 'bold' : 'normal'
                  }
                }}
              />
            ))}
          </RadioGroup>
        </Paper>
      )}

      {showAnswer && (
        <Paper 
          elevation={3} 
          sx={{ 
            mt: 3, 
            p: 3,
            animation: `${fadeIn} 0.3s ease-out`,
            transform: 'translateY(0)'
          }}
        >
          <Alert 
            severity={player1.selectedAnswer === currentQuestion.correctAnswer ? "success" : "info"}
            icon={player1.selectedAnswer === currentQuestion.correctAnswer ? '🎉' : '💡'}
            sx={{ 
              '& .MuiAlert-icon': {
                fontSize: '1.5rem',
                alignSelf: 'flex-start',
                marginTop: '4px'
              }
            }}
          >
            <Typography variant="h6" gutterBottom>
              {player1.selectedAnswer === currentQuestion.correctAnswer 
                ? "Excellent! That's correct!" 
                : `The correct answer is: ${currentQuestion.correctAnswer}`}
            </Typography>
            <Typography sx={{ animation: `${fadeIn} 0.4s ease-out` }}>
              {currentQuestion.explanation}
            </Typography>
            {!isMultiplayer && (
              <Box sx={{ 
                mt: 3, 
                display: 'flex', 
                justifyContent: 'center',
                animation: `${fadeIn} 0.5s ease-out`
              }}>
                <Button
                  variant="contained"
                  color={player1.selectedAnswer === currentQuestion.correctAnswer ? "success" : "primary"}
                  onClick={handleNextQuestion}
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      transform: 'scale(1.02)',
                      transition: 'transform 0.2s ease'
                    }
                  }}
                >
                  {currentQuestionIndex + 1 >= QUESTIONS_PER_GAME ? "See Results" : "Next Question"}
                </Button>
              </Box>
            )}
          </Alert>
        </Paper>
      )}
    </Container>
  );
} 