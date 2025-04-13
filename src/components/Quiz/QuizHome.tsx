import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Category } from '../../types/quiz';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CardActionArea,
  Box,
  AppBar,
  Toolbar,
  Button,
  Badge
} from '@mui/material';

const categories: { id: Category; name: string; icon: string; }[] = [
  { id: 'history', name: 'History', icon: '📚' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'mythology', name: 'Mythology', icon: '🏺' },
  { id: 'politics', name: 'Politics', icon: '🏛️' },
  { id: 'bollywood', name: 'Bollywood', icon: '🎬' },
  { id: 'science', name: 'Science', icon: '🔬' }
];

export default function QuizHome() {
  const [onlinePlayers, setOnlinePlayers] = useState(0);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    // Simulate random online players (50-500)
    const updateOnlinePlayers = () => {
      setOnlinePlayers(Math.floor(Math.random() * 450) + 50);
    };
    
    updateOnlinePlayers();
    const interval = setInterval(updateOnlinePlayers, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Adaptive Quiz
          </Typography>
          <Badge badgeContent={onlinePlayers} color="secondary" sx={{ mr: 2 }}>
            <Typography>🎮 Online</Typography>
          </Badge>
          <Button color="inherit" onClick={() => navigate('/leaderboard')}>
            Leaderboard
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Choose Your Quiz Category
        </Typography>
        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Card>
                <CardActionArea 
                  onClick={() => navigate(`/quiz/${category.id}`)}
                  sx={{ height: '100%' }}
                >
                  <CardContent>
                    <Typography variant="h2" align="center" sx={{ mb: 2 }}>
                      {category.icon}
                    </Typography>
                    <Typography variant="h6" align="center">
                      {category.name}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
} 