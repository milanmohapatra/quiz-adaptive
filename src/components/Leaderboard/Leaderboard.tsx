import { useState, useEffect } from 'react';
import { Category } from '../../types/quiz';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Box,
  CircularProgress,
  Avatar
} from '@mui/material';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  questionsAnswered: number;
  category?: Category;
  avatar?: string;
}

// Mock data with Indian and American names
const mockPlayers = [
  { name: 'Arjun Patel', avatar: '🇮🇳' },
  { name: 'Sarah Johnson', avatar: '🇺🇸' },
  { name: 'Priya Sharma', avatar: '🇮🇳' },
  { name: 'Michael Williams', avatar: '🇺🇸' },
  { name: 'Rahul Verma', avatar: '🇮🇳' },
  { name: 'Emily Davis', avatar: '🇺🇸' },
  { name: 'Ananya Singh', avatar: '🇮🇳' },
  { name: 'John Smith', avatar: '🇺🇸' },
  { name: 'Ravi Kumar', avatar: '🇮🇳' },
  { name: 'Jessica Brown', avatar: '🇺🇸' },
  { name: 'Neha Gupta', avatar: '🇮🇳' },
  { name: 'David Miller', avatar: '🇺🇸' },
  { name: 'Aditya Shah', avatar: '🇮🇳' },
  { name: 'Emma Wilson', avatar: '🇺🇸' },
  { name: 'Vikram Malhotra', avatar: '🇮🇳' }
];

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'global' | Category>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const generateMockLeaderboard = (category: 'global' | Category) => {
    // Shuffle and select random players
    const shuffledPlayers = [...mockPlayers].sort(() => Math.random() - 0.5);
    const selectedPlayers = shuffledPlayers.slice(0, 10);

    // Generate random scores based on category
    return selectedPlayers.map((player, index) => {
      const baseScore = Math.floor(Math.random() * 500) + 500; // Score between 500-1000
      const questionsAnswered = Math.floor(baseScore / 50); // Roughly 50 points per question
      
      return {
        userId: `user-${index}`,
        displayName: player.name,
        score: baseScore,
        questionsAnswered,
        avatar: player.avatar,
        category
      };
    }).sort((a, b) => b.score - a.score); // Sort by score
  };

  useEffect(() => {
    // Simulate loading delay
    setLoading(true);
    setTimeout(() => {
      setLeaderboard(generateMockLeaderboard(selectedCategory));
      setLoading(false);
    }, 500);
  }, [selectedCategory]);

  const categories: (Category | 'global')[] = [
    'global',
    'history',
    'sports',
    'mythology',
    'politics',
    'bollywood',
    'science'
  ];

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ 
        fontWeight: 'bold',
        color: 'primary.main',
        mb: 3
      }}>
        Leaderboard
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedCategory}
          onChange={(_, newValue) => setSelectedCategory(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {categories.map(category => (
            <Tab
              key={category}
              label={category.charAt(0).toUpperCase() + category.slice(1)}
              value={category}
            />
          ))}
        </Tabs>
      </Box>

      <TableContainer component={Paper} sx={{ 
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rank</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Player</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Score</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Questions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboard.map((entry, index) => (
              <TableRow
                key={entry.userId}
                sx={{ 
                  '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                  transition: 'background-color 0.2s',
                  '&:hover': { backgroundColor: 'action.selected' }
                }}
              >
                <TableCell component="th" scope="row" sx={{ 
                  fontWeight: 'bold',
                  color: index < 3 ? 'primary.main' : 'inherit'
                }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </TableCell>
                <TableCell sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Typography variant="body1" component="span" sx={{ fontSize: '1.2rem' }}>
                    {entry.avatar}
                  </Typography>
                  {entry.displayName}
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontWeight: 'bold',
                  color: 'success.main'
                }}>
                  {entry.score.toLocaleString()}
                </TableCell>
                <TableCell align="right">{entry.questionsAnswered}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
} 