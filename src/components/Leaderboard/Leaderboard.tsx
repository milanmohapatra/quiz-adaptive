import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
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
  CircularProgress
} from '@mui/material';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  questionsAnswered: number;
  category?: Category;
}

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'global' | Category>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const userProgressRef = collection(db, 'userProgress');
      let q;

      if (selectedCategory === 'global') {
        q = query(userProgressRef, orderBy('totalScore', 'desc'), limit(10));
      } else {
        q = query(
          userProgressRef,
          orderBy(`categoryProgress.${selectedCategory}.score`, 'desc'),
          limit(10)
        );
      }

      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          userId: doc.id,
          displayName: data.displayName || 'Anonymous Player',
          score: selectedCategory === 'global' 
            ? data.totalScore 
            : data.categoryProgress?.[selectedCategory]?.score || 0,
          questionsAnswered: selectedCategory === 'global'
            ? data.questionsAnswered
            : data.categoryProgress?.[selectedCategory]?.questionsAnswered || 0
        };
      });

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
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
      <Typography variant="h4" gutterBottom>
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Player</TableCell>
              <TableCell align="right">Score</TableCell>
              <TableCell align="right">Questions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboard.map((entry, index) => (
              <TableRow
                key={entry.userId}
                sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
              >
                <TableCell component="th" scope="row">
                  {index + 1}
                </TableCell>
                <TableCell>{entry.displayName}</TableCell>
                <TableCell align="right">{entry.score}</TableCell>
                <TableCell align="right">{entry.questionsAnswered}</TableCell>
              </TableRow>
            ))}
            {leaderboard.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No entries yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
} 