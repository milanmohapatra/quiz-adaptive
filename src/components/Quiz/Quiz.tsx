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

export default function Quiz() {
  const { category } = useParams<{ category?: Category }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(true);
  const [player1Name, setPlayer1Name] = useState('');
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

  const handleStartGame = () => {
    if (!player1Name.trim() || !player2Name.trim()) {
      setError('Please enter names for both players');
      return;
    }
    
    player1.name = player1Name.trim();
    player2.name = player2Name.trim();
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
    } else {
      player2.selectedAnswer = answer;
      player2.hasAnswered = true;
      if (isCorrect) player2.score++;
    }

    // Show answer and proceed to next question
    setShowAnswer(true);
    setTimeout(() => {
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
    }, 2000);
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

  if (showNameDialog) {
    return (
      <Container maxWidth="sm">
        <Dialog open={showNameDialog} onClose={() => navigate('/')} maxWidth="sm" fullWidth>
          <DialogTitle>Enter Player Names</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                autoFocus
                fullWidth
                label="Player 1 Name"
                value={player1Name}
                onChange={(e) => setPlayer1Name(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Player 2 Name"
                value={player2Name}
                onChange={(e) => setPlayer2Name(e.target.value)}
              />
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
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
              🎮 Game Over! 🎮
            </Typography>
            
            <Box sx={{ my: 4 }}>
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

      <Grid container spacing={3}>
        {/* Player 1's Side */}
        <Grid item xs={12} md={6} component={Paper} elevation={3} 
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
        </Grid>

        {/* Player 2's Side */}
        <Grid item xs={12} md={6} component={Paper} elevation={3}
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
        </Grid>
      </Grid>

      {showAnswer && (
        <Paper elevation={3} sx={{ mt: 3, p: 3 }}>
          <Alert severity="info">
            <Typography variant="h6" gutterBottom>
              Correct Answer: {currentQuestion.correctAnswer}
            </Typography>
            <Typography>
              {currentQuestion.explanation}
            </Typography>
          </Alert>
        </Paper>
      )}
    </Container>
  );
} 