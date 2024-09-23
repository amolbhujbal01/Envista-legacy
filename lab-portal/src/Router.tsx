import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import ServiceRequests from '@/pages/ServiceRequests';
import ServiceRequest from './pages/ServiceRequest';
import PrivateRoute from '@/components/PrivateRoute';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/register',
    element: <Register />,
  },

  {
    element: <PrivateRoute />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/service-requests',
        element: <ServiceRequests />,
      },
      {
        path: '/service-requests/:practiceId/:requestId',
        element: <ServiceRequest />,
      },
    ],
  },
]);

const Router = () => {
  return <RouterProvider router={router} />;
};

export default Router;
