import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Allow both authenticated users and guests
  if (!currentUser && !isGuest) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
} 