import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { type RootState } from '@/app/store';

const PrivateRoute: React.FC = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => !!state.auth.accessToken
  );

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
