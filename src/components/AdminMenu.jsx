import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  SupervisorAccount as AdminIcon,
  LocalShipping as FastagIcon,
  History as HistoryIcon,
  Assignment as AssignmentIcon,
  BarChart as AnalyticsIcon,
  Settings as SettingsIcon,
  ListAlt as RegistrationHistoryIcon,
  AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const AdminMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, isSuperAdmin } = useAuth();
  
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      adminOnly: false
    },
    {
      text: 'User Management',
      icon: <PeopleIcon />,
      path: '/users',
      adminOnly: false
    },
    {
      text: 'Wallet Top-ups',
      icon: <WalletIcon />,
      path: '/wallet-topups',
      adminOnly: true
    },
    {
      text: 'FastTag Management',
      icon: <FastagIcon />,
      path: '/fastag-management',
      adminOnly: false
    },
    {
      text: 'FasTag Registration History',
      icon: <RegistrationHistoryIcon />,
      path: '/fastag-registration-history',
      adminOnly: true
    },
    {
      text: 'Assignment Logs',
      icon: <AssignmentIcon />,
      path: '/assignment-logs',
      adminOnly: true
    },
    {
      text: 'Activity History',
      icon: <HistoryIcon />,
      path: '/activity-history',
      adminOnly: true
    },
    {
      text: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/analytics',
      adminOnly: false
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
      adminOnly: false
    }
  ];
  
  const handleNavigation = (path) => {
    navigate(path);
  };
  
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <Box>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="primary">
          {isSuperAdmin ? 'Admin Dashboard' : 'Sub-Admin Dashboard'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {userData?.displayName || userData?.email || 'User'}
        </Typography>
      </Box>
      
      <Divider />
      
      <List component="nav">
        {menuItems.map((item) => {
          // Skip admin-only items for non-super-admins
          if (item.adminOnly && !isSuperAdmin) return null;
          
          return (
            <ListItem
              button
              key={item.text}
              onClick={() => handleNavigation(item.path)}
              selected={isActiveRoute(item.path)}
              sx={{
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  }
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default AdminMenu; 