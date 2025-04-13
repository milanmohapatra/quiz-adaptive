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
  Badge,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import { keyframes } from '@mui/system';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const categories: { id: Category; name: string; icon: string; description: string; }[] = [
  { id: 'history', name: 'History', icon: '📚', description: 'Test your knowledge of world history and major events' },
  { id: 'sports', name: 'Sports', icon: '⚽', description: 'Challenge yourself with sports trivia and facts' },
  { id: 'mythology', name: 'Mythology', icon: '🏺', description: 'Explore ancient myths and legends from around the world' },
  { id: 'politics', name: 'Politics', icon: '🏛️', description: 'Stay informed with political knowledge and current affairs' },
  { id: 'bollywood', name: 'Bollywood', icon: '🎬', description: 'Dive into the world of Indian cinema and entertainment' },
  { id: 'science', name: 'Science', icon: '🔬', description: 'Discover fascinating facts about science and technology' }
];

export default function QuizHome() {
  const [onlinePlayers, setOnlinePlayers] = useState(0);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    // Simulate random online players (3-20)
    const updateOnlinePlayers = () => {
      setOnlinePlayers(Math.floor(Math.random() * 18) + 3);
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
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      pb: 8
    }}>
      <AppBar 
        position="sticky" 
        elevation={1}
        sx={{ 
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          width: '100vw',
          left: 0,
          right: 0
        }}
      >
        <Toolbar sx={{ maxWidth: '1400px', width: '100%', mx: 'auto' }}>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              color: 'primary.main',
              fontWeight: 'bold',
              fontSize: '1.5rem'
            }}
          >
            Adaptive Quiz
          </Typography>
          <Badge 
            badgeContent={onlinePlayers} 
            color="secondary" 
            sx={{ 
              mr: 3,
              '& .MuiBadge-badge': {
                fontSize: '0.9rem',
                padding: '0 8px'
              }
            }}
          >
            <Typography sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'primary.main',
              fontWeight: 'medium'
            }}>
              <span style={{ fontSize: '1.2rem' }}>🎮</span> Online
            </Typography>
          </Badge>
          <Button 
            color="primary" 
            onClick={() => navigate('/leaderboard')}
            sx={{ mr: 2, fontWeight: 'bold' }}
          >
            Leaderboard
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleLogout}
            sx={{ fontWeight: 'bold' }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl">
        {/* Hero Section */}
        <Box 
          sx={{ 
            textAlign: 'center',
            py: 8,
            animation: `${fadeIn} 0.6s ease-out`
          }}
        >
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}
          >
            Welcome to Adaptive Quiz
          </Typography>
          <Typography 
            variant="h5" 
            color="text.secondary"
            sx={{ mb: 6, maxWidth: '800px', mx: 'auto' }}
          >
            Choose your favorite category and challenge yourself with our adaptive difficulty system
          </Typography>
        </Box>

        {/* Categories Grid */}
        <Grid 
          container 
          spacing={4} 
          sx={{ 
            px: { xs: 2, md: 4 },
            maxWidth: '1400px',
            mx: 'auto',
            justifyContent: 'center'
          }}
        >
          {categories.map((category, index) => (
            <Grid item key={category.id} xs={12} sm={6} md={4} lg={4}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
                  minHeight: '280px',
                  bgcolor: 'background.paper',
                  borderRadius: 4,
                  transition: 'all 0.3s ease',
                  animation: `${fadeIn} ${0.3 + index * 0.1}s ease-out`,
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                    '& .category-icon': {
                      transform: 'scale(1.1)',
                    }
                  }
                }}
              >
                <CardActionArea 
                  onClick={() => navigate(`/quiz/${category.id}`)}
                  sx={{ 
                    height: '100%',
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2
                  }}
                >
                  <Typography 
                    variant="h2" 
                    className="category-icon"
                    sx={{ 
                      fontSize: '4.5rem',
                      transition: 'transform 0.3s ease',
                      mb: 1
                    }}
                  >
                    {category.icon}
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: 'primary.main',
                      mb: 1
                    }}
                  >
                    {category.name}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    align="center"
                    sx={{ 
                      opacity: 0.8,
                      maxWidth: '280px',
                      lineHeight: 1.6
                    }}
                  >
                    {category.description}
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
} 