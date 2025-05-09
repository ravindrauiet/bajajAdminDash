import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const statusColors = {
  available: 'success',
  assigned: 'primary',
  active: 'secondary',
  inactive: 'error',
  pending: 'warning'
};

const FastagManagement = () => {
  const db = getFirestore();
  const [open, setOpen] = useState(false);
  const [fastags, setFastags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFastag, setSelectedFastag] = useState(null);
  const [formValues, setFormValues] = useState({
    serialNo: '',
    tid: '',
    status: 'available',
    assignedTo: '',
  });
  const [filter, setFilter] = useState({
    status: '',
    searchTerm: '',
  });
  const [subadmins, setSubadmins] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fastagToDelete, setFastagToDelete] = useState(null);

  useEffect(() => {
    fetchFastags();
    fetchSubadmins();
  }, []);

  const fetchFastags = async () => {
    setLoading(true);
    try {
      let fastagQuery = collection(db, 'fastags');
      
      // Apply filters if they exist
      if (filter.status) {
        fastagQuery = query(fastagQuery, where('status', '==', filter.status));
      }
      
      // Order by creation date
      fastagQuery = query(fastagQuery, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(fastagQuery);
      const fastagList = [];
      
      querySnapshot.forEach((doc) => {
        fastagList.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Apply search filter client-side
      let filteredList = fastagList;
      if (filter.searchTerm) {
        const searchTermLower = filter.searchTerm.toLowerCase();
        filteredList = fastagList.filter(
          (fastag) => 
            (fastag.serialNo && fastag.serialNo.toLowerCase().includes(searchTermLower)) ||
            (fastag.tid && fastag.tid.toLowerCase().includes(searchTermLower)) ||
            (fastag.vehicleNo && fastag.vehicleNo.toLowerCase().includes(searchTermLower)) ||
            (fastag.mobileNo && fastag.mobileNo.includes(filter.searchTerm))
        );
      }
      
      setFastags(filteredList);
    } catch (error) {
      console.error('Error fetching FastTags:', error);
      alert('Failed to fetch FastTags');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubadmins = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('role', 'in', ['admin', 'subadmin'])
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const adminList = [];
      
      querySnapshot.forEach((doc) => {
        adminList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      setSubadmins(adminList);
    } catch (error) {
      console.error('Error fetching subadmins:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({
      ...filter,
      [name]: value,
    });
  };

  const handleSearch = () => {
    fetchFastags();
  };

  const resetForm = () => {
    setFormValues({
      serialNo: '',
      tid: '',
      status: 'available',
      assignedTo: '',
    });
    setSelectedFastag(null);
  };

  const openAddModal = () => {
    resetForm();
    setOpen(true);
  };

  const openEditModal = (fastag) => {
    setSelectedFastag(fastag);
    setFormValues({
      serialNo: fastag.serialNo || '',
      tid: fastag.tid || '',
      status: fastag.status || 'available',
      assignedTo: fastag.assignedTo || '',
    });
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
  };

  const handleCloseDeleteDialog = () => {
    setConfirmDelete(false);
    setFastagToDelete(null);
  };

  const handleSubmit = async () => {
    if (!formValues.serialNo) {
      alert('Serial number is required');
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (selectedFastag) {
        // Update existing FastTag
        const fastagRef = doc(db, 'fastags', selectedFastag.id);
        
        await updateDoc(fastagRef, {
          serialNo: formValues.serialNo,
          tid: formValues.tid || null,
          status: formValues.status,
          assignedTo: formValues.assignedTo || null,
          updatedAt: new Date(),
          updatedBy: user ? user.uid : null,
        });

        alert('FastTag updated successfully');
      } else {
        // Add new FastTag
        const fastagData = {
          serialNo: formValues.serialNo,
          tid: formValues.tid || null,
          status: formValues.status,
          assignedTo: formValues.assignedTo || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: user ? {
            uid: user.uid,
            email: user.email
          } : null,
        };

        // Check if this serial number already exists
        const existingQuery = query(
          collection(db, 'fastags'),
          where('serialNo', '==', formValues.serialNo)
        );
        
        const existingSnapshot = await getDocs(existingQuery);
        
        if (!existingSnapshot.empty) {
          alert('A FastTag with this serial number already exists');
          return;
        }

        await setDoc(doc(collection(db, 'fastags')), fastagData);

        alert('FastTag added successfully');
      }

      handleCloseModal();
      resetForm();
      fetchFastags();
    } catch (error) {
      console.error('Error saving FastTag:', error);
      alert('Failed to save FastTag');
    }
  };

  const openDeleteConfirmation = (id) => {
    setFastagToDelete(id);
    setConfirmDelete(true);
  };

  const handleDeleteFastag = async () => {
    if (!fastagToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'fastags', fastagToDelete));
      
      alert('FastTag deleted successfully');
      handleCloseDeleteDialog();
      fetchFastags();
    } catch (error) {
      console.error('Error deleting FastTag:', error);
      alert('Failed to delete FastTag');
    }
  };

  const getStatusChip = (status) => {
    return (
      <Chip 
        label={status.charAt(0).toUpperCase() + status.slice(1)} 
        color={statusColors[status] || 'default'} 
        size="small" 
      />
    );
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>FastTag Management</Typography>

        {/* Filter and Search */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  name="status"
                  value={filter.status}
                  onChange={handleFilterChange}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="assigned">Assigned</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={7}>
              <TextField
                fullWidth
                name="searchTerm"
                value={filter.searchTerm}
                onChange={handleFilterChange}
                placeholder="Search by serial number, TID, vehicle number, or mobile"
                size="small"
              />
            </Grid>

            <Grid item xs={6} sm={1}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={loading}
              >
                Search
              </Button>
            </Grid>

            <Grid item xs={6} sm={1}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openAddModal}
              >
                Add
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* FastTags Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Serial Number</TableCell>
                <TableCell>TID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Vehicle Number</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : fastags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No FastTags found
                  </TableCell>
                </TableRow>
              ) : (
                fastags.map((fastag) => (
                  <TableRow key={fastag.id}>
                    <TableCell>{fastag.serialNo}</TableCell>
                    <TableCell>{fastag.tid || '-'}</TableCell>
                    <TableCell>{getStatusChip(fastag.status || 'unknown')}</TableCell>
                    <TableCell>{fastag.vehicleNo || '-'}</TableCell>
                    <TableCell>{fastag.mobileNo || '-'}</TableCell>
                    <TableCell>
                      {fastag.assignedTo
                        ? subadmins.find(admin => admin.id === fastag.assignedTo)?.name || fastag.assignedTo
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {fastag.createdAt
                        ? new Date(fastag.createdAt.seconds * 1000).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => openEditModal(fastag)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openDeleteConfirmation(fastag.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* Add/Edit Dialog */}
        <Dialog open={open} onClose={handleCloseModal} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedFastag ? 'Edit FastTag' : 'Add FastTag'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Stack spacing={3}>
                <TextField
                  required
                  name="serialNo"
                  label="Serial Number"
                  value={formValues.serialNo}
                  onChange={handleInputChange}
                  fullWidth
                />

                <TextField
                  name="tid"
                  label="TID"
                  value={formValues.tid}
                  onChange={handleInputChange}
                  fullWidth
                />

                <FormControl fullWidth>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={formValues.status}
                    onChange={handleInputChange}
                    label="Status"
                  >
                    <MenuItem value="available">Available</MenuItem>
                    <MenuItem value="assigned">Assigned</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id="assigned-to-label">Assign To</InputLabel>
                  <Select
                    labelId="assigned-to-label"
                    name="assignedTo"
                    value={formValues.assignedTo}
                    onChange={handleInputChange}
                    label="Assign To"
                  >
                    <MenuItem value="">None</MenuItem>
                    {subadmins.map((admin) => (
                      <MenuItem key={admin.id} value={admin.id}>
                        {admin.name || admin.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedFastag ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirm Delete Dialog */}
        <Dialog
          open={confirmDelete}
          onClose={handleCloseDeleteDialog}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this FastTag? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button onClick={handleDeleteFastag} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default FastagManagement; 