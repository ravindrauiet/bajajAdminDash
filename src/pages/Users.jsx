import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Tooltip, 
  Snackbar, 
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Edit as EditIcon, 
  PersonAdd as AssignIcon,
  PersonRemove as UnassignIcon 
} from '@mui/icons-material';
import { 
  getAllUsers, 
  updateUserData,
  getUsersBySubAdmin,
  getSubAdmins,
  assignUserToSubAdmin,
  unassignUserFromSubAdmin,
  createOrUpdateUser
} from '../api/firestoreApi';
import { useAuth } from '../contexts/AuthContext';

function Users() {
  const [users, setUsers] = useState([]);
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [assigningUser, setAssigningUser] = useState(null);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState('');
  const { userData, isSuperAdmin, isSubAdmin } = useAuth();
  
  const [editForm, setEditForm] = useState({
    displayName: '',
    email: '',
    role: 'user',
    status: 'active',
    phone: '',
    address: '',
    aadharCard: '',
    panCard: '',
    password: ''
  });

  useEffect(() => {
    fetchData();
  }, [isSuperAdmin, isSubAdmin, userData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch sub-admins if user is super admin
      if (isSuperAdmin) {
        const { success, subAdmins, error } = await getSubAdmins();
        if (success) {
          setSubAdmins(subAdmins);
        } else {
          console.error('Error fetching sub-admins:', error);
        }
      }
      
      // Fetch users based on role
      let usersData = [];
      if (isSuperAdmin) {
        // Super admin sees all users
        const { success, users, error } = await getAllUsers();
        if (success) {
          usersData = users;
        } else {
          throw new Error(error);
        }
      } else if (isSubAdmin && userData?.id) {
        // Sub-admin sees only assigned users
        const { success, users, error } = await getUsersBySubAdmin(userData.id);
        if (success) {
          usersData = users;
        } else {
          throw new Error(error);
        }
      }
      
      console.log('Fetched users:', usersData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
      showSnackbar('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Define columns for the data grid
  const getColumns = () => {
    const baseColumns = [
      { 
        field: 'id', 
        headerName: 'ID', 
        width: 90 
      },
      { 
        field: 'displayName', 
        headerName: 'Name', 
        width: 150,
        renderCell: (params) => {
          return <span>{params.row?.displayName || 'No Name'}</span>;
        }
      },
      { 
        field: 'email', 
        headerName: 'Email', 
        width: 200,
        renderCell: (params) => {
          return <span>{params.row?.email || 'No Email'}</span>;
        }
      },
      { 
        field: 'phone', 
        headerName: 'Phone', 
        width: 130,
        renderCell: (params) => {
          return <span>{params.row?.phone || 'N/A'}</span>;
        }
      },
      { 
        field: 'aadharCard', 
        headerName: 'Aadhar Card', 
        width: 150,
        renderCell: (params) => {
          return <span>{params.row?.aadharCard || 'N/A'}</span>;
        }
      },
      { 
        field: 'panCard', 
        headerName: 'PAN Card', 
        width: 130,
        renderCell: (params) => {
          return <span>{params.row?.panCard || 'N/A'}</span>;
        }
      },
      { 
        field: 'role', 
        headerName: 'Role', 
        width: 130,
        renderCell: (params) => {
          const role = params.row?.role || 'user';
          return (
            <Chip 
              label={role} 
              color={
                role === 'admin' ? 'primary' : 
                role === 'subAdmin' ? 'secondary' : 
                'default'
              }
              size="small"
            />
          );
        }
      },
      { 
        field: 'status', 
        headerName: 'Status', 
        width: 130,
        renderCell: (params) => {
          const status = params.row?.status || 'inactive';
          return (
            <Chip
              label={status}
              color={status === 'active' ? 'success' : 'error'}
              size="small"
            />
          );
        }
      },
      {
        field: 'edit',
        headerName: 'Edit',
        width: 60,
        renderCell: (params) => {
          return (
            <IconButton
              onClick={() => handleEditUser(params.row)}
              size="small"
              color="primary"
            >
              <EditIcon />
            </IconButton>
          );
        }
      }
    ];
    
    // Add assignment column for super admin
    if (isSuperAdmin) {
      baseColumns.push({
        field: 'assignedTo',
        headerName: 'Assigned To',
        width: 150,
        renderCell: (params) => {
          const assignedTo = params.row?.assignedTo;
          const assignedSubAdmin = subAdmins.find(admin => admin.id === assignedTo);
          
          return assignedSubAdmin ? (
            <Chip
              label={assignedSubAdmin.displayName || assignedSubAdmin.email}
              color="info"
              size="small"
            />
          ) : (
            <span>Not assigned</span>
          );
        }
      });
      
      baseColumns.push({
        field: 'assign',
        headerName: 'Assign',
        width: 100,
        renderCell: (params) => {
          // Don't allow assigning admins or sub-admins
          if (params.row?.role === 'admin' || params.row?.role === 'subAdmin') {
            return null;
          }
          
          return params.row?.assignedTo ? (
            <Tooltip title="Unassign user">
              <IconButton
                onClick={() => handleUnassignUser(params.row)}
                size="small"
                color="error"
              >
                <UnassignIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Assign to sub-admin">
              <IconButton
                onClick={() => handleOpenAssignDialog(params.row)}
                size="small"
                color="primary"
              >
                <AssignIcon />
              </IconButton>
            </Tooltip>
          );
        }
      });
    }
    
    return baseColumns;
  };

  const handleEditUser = (user) => {
    console.log('Editing user:', user);
    if (!user) {
      console.error('Cannot edit undefined user');
      return;
    }
    
    setEditingUser(user);
    setEditForm({
      displayName: user.displayName || '',
      email: user.email || '',
      role: user.role || 'user',
      status: user.status || 'active',
      phone: user.phone || '',
      address: user.address || '',
      aadharCard: user.aadharCard || '',
      panCard: user.panCard || '',
      password: '' // Password field starts empty for security
    });
    setEditDialogOpen(true);
  };

  const handleOpenAssignDialog = (user) => {
    setAssigningUser(user);
    setSelectedSubAdmin('');
    setAssignDialogOpen(true);
  };

  const handleAssignUser = async () => {
    if (!assigningUser || !selectedSubAdmin) return;
    
    try {
      setLoading(true);
      const { success, error } = await assignUserToSubAdmin(assigningUser.id, selectedSubAdmin);
      
      if (success) {
        await fetchData();
        setAssignDialogOpen(false);
        showSnackbar('User assigned successfully', 'success');
      } else {
        showSnackbar(error || 'Failed to assign user', 'error');
      }
    } catch (err) {
      console.error('Error assigning user:', err);
      showSnackbar('Failed to assign user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignUser = async (user) => {
    try {
      setLoading(true);
      const { success, error } = await unassignUserFromSubAdmin(user.id);
      
      if (success) {
        await fetchData();
        showSnackbar('User unassigned successfully', 'success');
      } else {
        showSnackbar(error || 'Failed to unassign user', 'error');
      }
    } catch (err) {
      console.error('Error unassigning user:', err);
      showSnackbar('Failed to unassign user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingUser) return;
    
    try {
      setLoading(true);
      console.log('Updating user with data:', editForm);
      
      const { success, error } = await updateUserData(editingUser.id, {
        ...editForm,
        isAdmin: editForm.role === 'admin' || editForm.role === 'subAdmin'
      });
      
      if (success) {
        await fetchData();
        setEditDialogOpen(false);
        showSnackbar('User updated successfully', 'success');
      } else {
        showSnackbar(error || 'Failed to update user', 'error');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      showSnackbar('Failed to update user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value
    });
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isSuperAdmin ? 'User Management' : 'Your Assigned Users'}
      </Typography>
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={getColumns()}
          pageSize={10}
          rowsPerPageOptions={[10]}
          loading={loading}
          error={error}
          getRowId={(row) => row.id}
          disableColumnMenu
          disableSelectionOnClick
        />
      </Paper>
      
      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              name="displayName"
              value={editForm.displayName}
              onChange={handleEditFormChange}
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={editForm.email}
              onChange={handleEditFormChange}
              fullWidth
              disabled={!isSuperAdmin} // Only super admin can change email
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={editForm.role}
                onChange={handleEditFormChange}
                label="Role"
                disabled={!isSuperAdmin} // Only super admin can change role
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="subAdmin">Sub Admin</MenuItem>
                {isSuperAdmin && <MenuItem value="admin">Admin</MenuItem>}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={editForm.status}
                onChange={handleEditFormChange}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Phone"
              name="phone"
              value={editForm.phone}
              onChange={handleEditFormChange}
              fullWidth
            />
            <TextField
              label="Address"
              name="address"
              value={editForm.address}
              onChange={handleEditFormChange}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Aadhar Card"
              name="aadharCard"
              value={editForm.aadharCard}
              onChange={handleEditFormChange}
              fullWidth
            />
            <TextField
              label="PAN Card"
              name="panCard"
              value={editForm.panCard}
              onChange={handleEditFormChange}
              fullWidth
            />
            {isSuperAdmin && (
              <TextField
                label="New Password (leave blank to keep unchanged)"
                name="password"
                type="password"
                value={editForm.password}
                onChange={handleEditFormChange}
                fullWidth
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Assign User Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
        <DialogTitle>Assign User to Sub-Admin</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Assign {assigningUser?.displayName || assigningUser?.email || 'user'} to:
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Sub-Admin</InputLabel>
              <Select
                value={selectedSubAdmin}
                onChange={(e) => setSelectedSubAdmin(e.target.value)}
                label="Select Sub-Admin"
              >
                {subAdmins.map((admin) => (
                  <MenuItem key={admin.id} value={admin.id}>
                    {admin.displayName || admin.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAssignUser} 
            variant="contained" 
            color="primary"
            disabled={!selectedSubAdmin}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Users; 