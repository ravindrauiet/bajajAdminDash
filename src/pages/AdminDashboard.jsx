import { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs
} from '@mui/material';
import { 
  People as PeopleIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  SupervisorAccount as AdminIcon,
  Dashboard as DashboardIcon,
  Edit as EditIcon,
  LocalShipping as FastagIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getAllUsers, 
  getSubAdmins, 
  createOrUpdateUser,
  getUsersBySubAdmin 
} from '../api/firestoreApi';
import FastagAssignmentOverview from '../components/FastagAssignmentOverview';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

function AdminDashboard() {
  const { currentUser } = useAuth();
  const db = getFirestore();
  
  // State for users and sub-admins
  const [users, setUsers] = useState([]);
  const [subAdmins, setSubAdmins] = useState([]);
  const [fastags, setFastags] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  
  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    displayName: '',
    password: '123456', // Default password
    role: 'subAdmin'
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all users
      const { success: usersSuccess, users: allUsers } = await getAllUsers();
      if (usersSuccess) {
        setUsers(allUsers);
      }
      
      // Fetch sub-admins
      const { success: adminsSuccess, subAdmins: admins } = await getSubAdmins();
      if (adminsSuccess) {
        setSubAdmins(admins);
      }
      
      // Fetch FastTags count
      try {
        const fastagRef = collection(db, 'fastags');
        const fastagSnapshot = await getDocs(fastagRef);
        const fastagList = [];
        
        fastagSnapshot.forEach((doc) => {
          fastagList.push({ id: doc.id, ...doc.data() });
        });
        
        setFastags(fastagList);
      } catch (error) {
        console.error('Error fetching FastTags:', error);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleSubAdminClick = async (subAdmin) => {
    setSelectedSubAdmin(subAdmin);
    
    try {
      setLoading(true);
      const { success, users } = await getUsersBySubAdmin(subAdmin.id);
      if (success) {
        setAssignedUsers(users);
      } else {
        setAssignedUsers([]);
      }
    } catch (error) {
      console.error('Error fetching assigned users:', error);
      setAssignedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubAdmin = async () => {
    try {
      setLoading(true);
      
      // Basic validation
      if (!newUserForm.email || !newUserForm.displayName) {
        alert('Email and name are required');
        return;
      }
      
      // Create new user with subAdmin role in Firestore
      const { success, error } = await createOrUpdateUser('', {
        email: newUserForm.email,
        displayName: newUserForm.displayName,
        password: newUserForm.password,
        role: 'subAdmin',
        isAdmin: true,
        createdAt: new Date(),
        status: 'active'
      });
      
      if (success) {
        setCreateDialogOpen(false);
        fetchDashboardData();
        
        // Reset form
        setNewUserForm({
          email: '',
          displayName: '',
          password: '123456',
          role: 'subAdmin'
        });
      } else {
        alert('Error creating sub-admin: ' + error);
      }
    } catch (error) {
      console.error('Error creating sub-admin:', error);
      alert('Error creating sub-admin');
    } finally {
      setLoading(false);
    }
  };

  // Stats for the dashboard
  const totalUsers = users.filter(user => user.role !== 'admin' && user.role !== 'subAdmin').length;
  const totalSubAdmins = subAdmins.length;
  const activeUsers = users.filter(user => user.status === 'active' && user.role !== 'admin' && user.role !== 'subAdmin').length;
  const totalFastags = fastags.length;
  const assignedFastags = fastags.filter(fastag => fastag.assignedTo).length;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      {/* Stats at the top */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140, bgcolor: 'primary.light', color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" gutterBottom>
                Total Users
              </Typography>
              <PeopleIcon fontSize="large" />
            </Box>
            <Typography variant="h3" component="div" sx={{ mt: 'auto' }}>
              {totalUsers}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140, bgcolor: 'secondary.light', color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" gutterBottom>
                Sub-Admins
              </Typography>
              <AdminIcon fontSize="large" />
            </Box>
            <Typography variant="h3" component="div" sx={{ mt: 'auto' }}>
              {totalSubAdmins}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140, bgcolor: 'success.light', color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" gutterBottom>
                Active Users
              </Typography>
              <DashboardIcon fontSize="large" />
            </Box>
            <Typography variant="h3" component="div" sx={{ mt: 'auto' }}>
              {activeUsers}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140, bgcolor: 'info.light', color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" gutterBottom>
                FastTags
              </Typography>
              <FastagIcon fontSize="large" />
            </Box>
            <Typography variant="h3" component="div" sx={{ mt: 'auto' }}>
              {totalFastags}
            </Typography>
            <Typography variant="body2" component="div">
              {assignedFastags} assigned
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Tabs for dashboard content */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Sub-Admin Management" />
          <Tab label="User Assignment Overview" />
          <Tab label="FastTag Assignment Overview" />
        </Tabs>
      </Paper>
      
      {/* Tab content */}
      <Box sx={{ mt: 2 }}>
        {/* Sub-Admin Management Tab */}
        {selectedTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 2, height: '65vh', overflow: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Sub-Admins
                  </Typography>
                  <Button 
                    startIcon={<PersonAddIcon />} 
                    variant="contained" 
                    color="primary"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    Add Sub-Admin
                  </Button>
                </Box>
                
                {loading ? (
                  <Typography>Loading...</Typography>
                ) : subAdmins.length === 0 ? (
                  <Typography>No sub-admins found.</Typography>
                ) : (
                  <List>
                    {subAdmins.map((admin) => (
                      <Box key={admin.id}>
                        <ListItem 
                          button 
                          selected={selectedSubAdmin?.id === admin.id}
                          onClick={() => handleSubAdminClick(admin)}
                        >
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                              {admin.displayName?.[0] || admin.email?.[0] || <AdminIcon />}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText 
                            primary={admin.displayName || admin.email} 
                            secondary={admin.email} 
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </Box>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 2, height: '65vh', overflow: 'auto' }}>
                {selectedSubAdmin ? (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        {selectedSubAdmin.displayName || selectedSubAdmin.email} 
                      </Typography>
                      <Button 
                        startIcon={<EditIcon />} 
                        variant="outlined" 
                        color="primary"
                        onClick={() => navigate('/users')}
                      >
                        Edit
                      </Button>
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                      Assigned Users ({assignedUsers.length})
                    </Typography>
                    
                    {assignedUsers.length === 0 ? (
                      <Typography>No users assigned to this sub-admin.</Typography>
                    ) : (
                      <Grid container spacing={2}>
                        {assignedUsers.map((user) => (
                          <Grid item xs={12} md={6} key={user.id}>
                            <Card variant="outlined">
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar sx={{ mr: 2, bgcolor: user.status === 'active' ? 'success.main' : 'error.main' }}>
                                    {user.displayName?.[0] || user.email?.[0] || <PersonIcon />}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle1">{user.displayName || user.email}</Typography>
                                    <Typography variant="body2" color="textSecondary">{user.email}</Typography>
                                  </Box>
                                </Box>
                              </CardContent>
                              <CardActions>
                                <Button 
                                  size="small" 
                                  onClick={() => navigate('/users')}
                                >
                                  View Details
                                </Button>
                              </CardActions>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <AdminIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Select a sub-admin to view details
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {/* User Assignment Overview Tab */}
        {selectedTab === 1 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              User Assignment Overview
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/users')}
              >
                Go to User Management
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              {subAdmins.map((admin) => (
                <Grid item xs={12} md={4} key={admin.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                          {admin.displayName?.[0] || admin.email?.[0] || <AdminIcon />}
                        </Avatar>
                        <Typography variant="h6">
                          {admin.displayName || admin.email}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {admin.email}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography>
                        <strong>Assigned Users:</strong> {
                          users.filter(user => user.assignedTo === admin.id).length
                        }
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={() => handleSubAdminClick(admin)}
                      >
                        View Assigned Users
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
              
              {subAdmins.length === 0 && (
                <Grid item xs={12}>
                  <Typography>No sub-admins have been created yet.</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}
        
        {/* FastTag Assignment Overview Tab */}
        {selectedTab === 2 && (
          <FastagAssignmentOverview />
        )}
      </Box>
      
      {/* Create Sub-Admin Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Sub-Admin</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, width: 400, maxWidth: '100%' }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={newUserForm.email}
              onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Name"
              fullWidth
              value={newUserForm.displayName}
              onChange={(e) => setNewUserForm({...newUserForm, displayName: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Default Password"
              type="password"
              fullWidth
              value={newUserForm.password}
              onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
              helperText="Sub-admin can change this after first login"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateSubAdmin} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            Create Sub-Admin
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminDashboard; 