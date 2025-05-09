import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { getFirestore, collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';

const ActivityHistory = () => {
  const db = getFirestore();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filter, setFilter] = useState({
    type: '',
    searchText: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const usersList = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        usersList.push({
          id: doc.id,
          displayName: userData.displayName || userData.email || 'Unknown User',
          email: userData.email,
          role: userData.role || 'user',
          activityCount: (userData.activityHistory || []).length
        });
      });
      
      // Sort by users with most activity first
      usersList.sort((a, b) => b.activityCount - a.activityCount);
      
      setUsers(usersList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const fetchUserActivity = async (user) => {
    try {
      setLoading(true);
      setSelectedUser(user);
      
      // Get user document
      const userRef = collection(db, 'users');
      const q = query(userRef, where('__name__', '==', user.id));
      const userSnapshot = await getDocs(q);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        let activityHistory = userData.activityHistory || [];
        
        // Apply filters if needed
        if (filter.type) {
          activityHistory = activityHistory.filter(activity => activity.type === filter.type);
        }
        
        if (filter.searchText) {
          const searchLower = filter.searchText.toLowerCase();
          activityHistory = activityHistory.filter(activity =>
            activity.description.toLowerCase().includes(searchLower)
          );
        }
        
        // Sort by timestamp (most recent first)
        activityHistory.sort((a, b) => {
          const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
          const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
          return dateB - dateA;
        });
        
        setActivities(activityHistory);
      } else {
        setActivities([]);
      }
      
      setPage(0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilter({
      ...filter,
      [name]: value
    });
  };

  const applyFilter = () => {
    if (selectedUser) {
      fetchUserActivity(selectedUser);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getActivityTypeChip = (type) => {
    let color = 'default';
    
    switch (type) {
      case 'login':
        color = 'success';
        break;
      case 'assignment':
        color = 'primary';
        break;
      case 'unassignment':
        color = 'warning';
        break;
      case 'status_change':
        color = 'info';
        break;
      case 'profile_update':
        color = 'secondary';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip
        label={type.replace('_', ' ')}
        color={color}
        size="small"
      />
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Activity History
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Users
            </Typography>
            
            {loading && !selectedUser ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {users.map(user => (
                  <Box key={user.id}>
                    <ListItem 
                      button 
                      selected={selectedUser?.id === user.id}
                      onClick={() => fetchUserActivity(user)}
                    >
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: user.role === 'admin' ? 'primary.main' : user.role === 'subAdmin' ? 'secondary.main' : 'success.main' }}>
                          {user.displayName[0]}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={user.displayName} 
                        secondary={
                          <Box>
                            <Typography variant="body2">{user.email}</Typography>
                            <Chip 
                              label={`${user.activityCount} activities`} 
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        } 
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Activity Type</InputLabel>
                  <Select
                    name="type"
                    value={filter.type}
                    onChange={handleFilterChange}
                    label="Activity Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="login">Login</MenuItem>
                    <MenuItem value="assignment">Assignment</MenuItem>
                    <MenuItem value="unassignment">Unassignment</MenuItem>
                    <MenuItem value="status_change">Status Change</MenuItem>
                    <MenuItem value="profile_update">Profile Update</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Description"
                  name="searchText"
                  value={filter.searchText}
                  onChange={handleFilterChange}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={applyFilter}
                  disabled={!selectedUser}
                >
                  Filter
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ height: 'calc(70vh - 72px)' }}>
            <TableContainer sx={{ maxHeight: 'calc(70vh - 72px - 52px)' }}>
              {loading && selectedUser ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : !selectedUser ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, height: '50vh' }}>
                  <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a user to view activity history
                  </Typography>
                </Box>
              ) : (
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Performed By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No activity history found
                        </TableCell>
                      </TableRow>
                    ) : (
                      activities
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((activity, index) => (
                          <TableRow key={activity.id || index}>
                            <TableCell>{formatDate(activity.timestamp)}</TableCell>
                            <TableCell>{getActivityTypeChip(activity.type)}</TableCell>
                            <TableCell>{activity.description}</TableCell>
                            <TableCell>
                              <Tooltip title={activity.performedBy || 'System'}>
                                <Typography variant="body2">
                                  {activity.performedBy ? 'Admin' : 'System'}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={activities.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ActivityHistory; 