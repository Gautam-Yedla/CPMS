import { FC } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IRootState } from '@app/appReducer';

export const Lending: FC = () => {
  const { isLoggedIn, user } = useSelector((state: IRootState) => state.app.auth);

  if (!isLoggedIn || !user) {
    return <Navigate replace to="/login" />;
  }

  // Role-based redirection logic
  switch (user.role) {
    case 'admin':
      return <Navigate replace to="/admin-dashboard" />;
    case 'faculty':
      return <Navigate replace to="/faculty-dashboard" />;
    case 'security':
      return <Navigate replace to="/security-dashboard" />;
    case 'student':
      return <Navigate replace to="/student-dashboard" />;
    case 'guest':
      return <Navigate replace to="/guest-access" />;
    default:
      return <Navigate replace to="/login" />;
  }
};
