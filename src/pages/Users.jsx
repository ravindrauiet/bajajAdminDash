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
import { Edit as EditIcon } from '@mui/icons-material';
import { getAllUsers, updateUser } from '../firebase/userService';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    email: '',
    role: 'user',
    status: 'active',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // Define columns for the data grid
  const columns = [
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
      field: 'actions',
      headerName: 'Edit',
      width: 100,
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
    },
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers();
      console.log('Fetched users:', usersData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
      showSnackbar('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
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
      address: user.address || ''
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingUser) return;
    
    try {
      setLoading(true);
      console.log('Updating user with data:', editForm);
      
      const result = await updateUser(editingUser.id, {
        ...editForm,
        isAdmin: editForm.role === 'admin'
      });
      
      if (result.success) {
        await fetchUsers();
        setEditDialogOpen(false);
        showSnackbar('User updated successfully', 'success');
      } else {
        showSnackbar(result.error || 'Failed to update user', 'error');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      showSnackbar('Failed to update user', 'error');
    } finally {
      setLoading(false);
    }
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
        User Management
      </Typography>
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
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
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User Details</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Display Name"
            value={editForm.displayName}
            onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Phone Number"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Address"
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              label="Role"
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="subAdmin">Sub Admin</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              label="Status"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Users; 