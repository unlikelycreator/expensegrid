import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import SignIn from './pages/Login/Login';
import BudgetTracker from './pages/BudgetTracker/BudgetTracker';
import CreditCards from './pages/CardTracker/CreditCard';
import Home from './pages/Home/Home';

// ProtectedRoute component to check for authentication
const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('authToken');
  const loginData = localStorage.getItem('loginData');

  if (!token || !loginData) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

// Layout component to wrap protected routes
const AppLayout = () => (
  <div>
    <Outlet />
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public route for login */}
      <Route path="/login" element={<SignIn />} />

      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Protected routes with layout */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/home" element={<Home />}>
          <Route path="budget-tracker" element={<BudgetTracker />} />
          <Route path="credit-tracker" element={<CreditCards />} />
          <Route index element={<Navigate to="budget-tracker" replace />} />
        </Route>
      </Route>

      {/* Catch-all redirect for undefined routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;