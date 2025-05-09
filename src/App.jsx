import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import SubAdminDashboard from './pages/SubAdminDashboard';
import FastagManagement from './pages/FastagManagement';
import AssignmentLogs from './components/AssignmentLogs';
import ActivityHistory from './components/ActivityHistory';
import FastagRegistrationHistory from './pages/FastagRegistrationHistory';
import WalletTopupRequests from './pages/WalletTopupRequests';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Protected Route component that checks for admin role
function AdminRoute({ children }) {
  const { currentUser, userData, loading } = useAuth();
  console.log('🔒 Admin Route Check:', { 
    isAuthenticated: !!currentUser, 
    isSuperAdmin: userData?.isSuperAdmin === true,
    isLoading: loading 
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser || !userData?.isAdmin) {
    console.log('🚫 Access denied, redirecting to login');
    return <Navigate to="/login" />;
  }
  
  // Only super admins can access admin-only routes
  if (userData?.isSuperAdmin !== true) {
    console.log('🚫 Access denied for non-super admin, redirecting to dashboard');
    return <Navigate to="/dashboard" />;
  }

  return children;
}

// Protected Route for any admin (super or sub)
function AdminOrSubAdminRoute({ children }) {
  const { currentUser, userData, loading } = useAuth();
  console.log('🔒 Admin/SubAdmin Route Check:', { 
    isAuthenticated: !!currentUser, 
    isAdmin: userData?.isAdmin,
    isLoading: loading 
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser || !userData?.isAdmin) {
    console.log('🚫 Access denied, redirecting to login');
    return <Navigate to="/login" />;
  }

  return children;
}

// Route that protects the dashboard and redirects based on role
function DashboardRedirect() {
  const { userData, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Super admin should never see the regular dashboard
  if (userData?.isSuperAdmin === true) {
    console.log('Super admin accessing /dashboard - redirecting to /admin');
    return <Navigate to="/admin" replace />;
  }
  
  // Sub-admin should use their specific dashboard
  if (userData?.role === 'subAdmin') {
    console.log('Sub-admin accessing /dashboard - redirecting to /subadmin');
    return <Navigate to="/subadmin" replace />;
  }
  
  // Regular users see the standard dashboard
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

// Index path component that redirects to the proper route based on user role
function IndexRedirect() {
  const { userData, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Redirect to the appropriate dashboard based on role
  if (userData?.isSuperAdmin === true) {
    console.log('Redirecting super admin to /admin');
    return <Navigate to="/admin" replace />;
  }
  
  if (userData?.role === 'subAdmin') {
    console.log('Redirecting sub-admin to /subadmin');
    return <Navigate to="/subadmin" replace />;
  }
  
  // Default route for normal users
  console.log('Redirecting user to /dashboard');
  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Root path decides where to redirect based on role */}
      <Route
        path="/"
        element={
          <AdminOrSubAdminRoute>
            <IndexRedirect />
          </AdminOrSubAdminRoute>
        }
      />
      
      {/* Dashboard - redirects based on role */}
      <Route
        path="/dashboard"
        element={
          <AdminOrSubAdminRoute>
            <DashboardRedirect />
          </AdminOrSubAdminRoute>
        }
      />
      
      {/* Admin-specific routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Layout>
              <AdminDashboard />
            </Layout>
          </AdminRoute>
        }
      />
      
      {/* Sub-admin dashboard */}
      <Route
        path="/subadmin"
        element={
          <AdminOrSubAdminRoute>
            <Layout>
              <SubAdminDashboard />
            </Layout>
          </AdminOrSubAdminRoute>
        }
      />
      
      {/* User management - accessible by any admin */}
      <Route
        path="/users"
        element={
          <AdminOrSubAdminRoute>
            <Layout>
              <Users />
            </Layout>
          </AdminOrSubAdminRoute>
        }
      />
      
      <Route
        path="/analytics"
        element={
          <AdminOrSubAdminRoute>
            <Layout>
              <Analytics />
            </Layout>
          </AdminOrSubAdminRoute>
        }
      />
      
      {/* Wallet top-up requests - accessible by super admin */}
      <Route
        path="/wallet-topups"
        element={
          <AdminRoute>
            <Layout>
              <WalletTopupRequests />
            </Layout>
          </AdminRoute>
        }
      />
      
      <Route
        path="/settings"
        element={
          <AdminOrSubAdminRoute>
            <Layout>
              <Settings />
            </Layout>
          </AdminOrSubAdminRoute>
        }
      />
      
      {/* Fastag Management */}
      <Route
        path="/fastag-management"
        element={
          <AdminOrSubAdminRoute>
            <Layout>
              <FastagManagement />
            </Layout>
          </AdminOrSubAdminRoute>
        }
      />
      
      {/* FasTag Registration History - Super Admin Only */}
      <Route
        path="/fastag-registration-history"
        element={
          <AdminRoute>
            <Layout>
              <FastagRegistrationHistory />
            </Layout>
          </AdminRoute>
        }
      />
      
      {/* Assignment Logs - Super Admin Only */}
      <Route
        path="/assignment-logs"
        element={
          <AdminRoute>
            <Layout>
              <AssignmentLogs />
            </Layout>
          </AdminRoute>
        }
      />
      
      {/* Activity History - Super Admin Only */}
      <Route
        path="/activity-history"
        element={
          <AdminRoute>
            <Layout>
              <ActivityHistory />
            </Layout>
          </AdminRoute>
        }
      />
      
      {/* Catch-all redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
