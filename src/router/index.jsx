import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import App from '../App.jsx';
import IndustryHub from '../features/hub/IndustryHub.jsx';
import DoorsLayout from '../features/doors/DoorsLayout.jsx';
import DoorsOverview from '../features/doors/DoorsOverview.jsx';

// Root layout that provides the base structure
const RootLayout = () => {
  return <Outlet />;
};

// Define all routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <App />,
      },
      {
        path: 'hub',
        element: <IndustryHub />,
      },
      {
        path: 'doors',
        element: <DoorsLayout />,
        children: [
          {
            index: true,
            element: <DoorsOverview />,
          },
          {
            path: 'schedule',
            element: <DoorsOverview />, // Placeholder - can be expanded later
          },
          {
            path: 'hardware',
            element: <DoorsOverview />, // Placeholder - can be expanded later
          },
          {
            path: 'masterkey',
            element: <DoorsOverview />, // Placeholder - can be expanded later
          },
        ],
      },
    ],
  },
]);

// Router provider component to wrap the app
export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default router;
