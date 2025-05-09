import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import AdminMenu from './AdminMenu';

const drawerWidth = 240;

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userData, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // Get the title for the current page
  const getPageTitle = () => {
    // Common paths
    if (location.pathname === '/admin') return 'Admin Dashboard';
    if (location.pathname === '/subadmin') return 'Sub-Admin Dashboard';
    if (location.pathname === '/dashboard') return 'Dashboard';
    if (location.pathname === '/users') return 'User Management';
    if (location.pathname === '/fastag-management') return 'FastTag Management';
    if (location.pathname === '/analytics') return 'Analytics';
    if (location.pathname === '/settings') return 'Settings';
    if (location.pathname === '/assignment-logs') return 'Assignment Logs';
    if (location.pathname === '/activity-history') return 'Activity History';
    
    // Default fallback
    return 'Dashboard';
  };

  const drawer = (
    <div>
      <AdminMenu />
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {getPageTitle()}
          </Typography>
          
          {/* User profile menu */}
          <Box>
            <Tooltip title={userData?.displayName || currentUser?.email || 'User'}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: userData?.isSuperAdmin ? 'primary.main' : 'secondary.main' }}>
                  {userData?.displayName?.[0] || currentUser?.email?.[0] || <PersonIcon />}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="textSecondary">
                  {userData?.role ? `Logged in as ${userData.role}` : 'Logged in'}
                </Typography>
              </MenuItem>
              <MenuItem onClick={() => {
                handleClose();
                navigate('/settings');
              }}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout; 