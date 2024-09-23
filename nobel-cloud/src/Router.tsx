import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import Register from '@/pages/Register';
import Home from '@/pages/Home';
import Patients from '@/pages/Patients';
import PatientCreation from '@/pages/PatientCreation';
import Patient from '@/pages/Patient';
import PrivateRoute from '@/components/PrivateRoute';
import JourneyCreation from '@/pages/JourneyCreation';
import Journey from '@/pages/Journey';
import ActiveJourneys from '@/pages/ActiveJourneys';
import ActiveJourney from '@/pages/ActiveJourney';

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
        element: <Home />,
      },
      {
        path: '/patients',
        element: <Patients />,
      },
      {
        path: '/patients/:id',
        element: <Patient />,
      },
      {
        path: '/patients/add',
        element: <PatientCreation />,
      },
      {
        path: '/active-journeys',
        element: <ActiveJourneys />,
      },
      {
        path: '/active-journeys/:id',
        element: <ActiveJourney />,
      },
      {
        path: '/patients/new-journey/:id',
        element: <JourneyCreation />,
      },
      {
        path: '/journey/:patientId/:journeyId',
        element: <Journey />,
      },
    ],
  },
]);

const Router = () => {
  return <RouterProvider router={router} />;
};

export default Router;
