import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress,
  Tooltip,
  IconButton,
  Grid,
  Card,
  CardContent,
  TablePagination
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc, runTransaction, query, orderBy, where } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

const statusColors = {
  pending: {
    bg: '#FFF9C4',
    color: '#F57F17'
  },
  approved: {
    bg: '#E8F5E9',
    color: '#2E7D32'
  },
  rejected: {
    bg: '#FFEBEE',
    color: '#C62828'
  }
};

function WalletTopupRequests() {
  const [topupRequests, setTopupRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  const db = getFirestore();

  useEffect(() => {
    fetchTopupRequests();
  }, []);

  const fetchTopupRequests = async () => {
    try {
      setLoading(true);
      
      const topupsRef = collection(db, 'wallet_topups');
      const q = query(topupsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const requests = [];
      let pendingCount = 0;
      let approvedCount = 0;
      let rejectedCount = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const requestWithId = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
        };
        
        requests.push(requestWithId);
        
        // Count by status
        if (data.status === 'pending') pendingCount++;
        else if (data.status === 'approved') approvedCount++;
        else if (data.status === 'rejected') rejectedCount++;
      });
      
      setTopupRequests(requests);
      setStats({
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: requests.length
      });
    } catch (error) {
      console.error('Error fetching topup requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
  };

  const handleApproveRequest = async (requestId) => {
    try {
      setLoading(true);
      
      // Get the request details
      const requestRef = doc(db, 'wallet_topups', requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        console.error('Request not found');
        return;
      }
      
      const requestData = requestSnap.data();
      const userId = requestData.userId;
      const amount = requestData.amount;
      
      // Use a transaction to update both the request status and the user's wallet balance
      await runTransaction(db, async (transaction) => {
        // Get the user document
        const userRef = doc(db, 'users', userId);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }
        
        // Calculate new wallet balance
        const userData = userDoc.data();
        const currentBalance = userData.wallet || 0;
        const newBalance = currentBalance + amount;
        
        // Update user's wallet balance
        transaction.update(userRef, { wallet: newBalance });
        
        // Update request status
        transaction.update(requestRef, { 
          status: 'approved',
          updatedAt: new Date(),
          adminNote: 'Approved and added to wallet balance'
        });
      });
      
      // Refresh the list after approval
      fetchTopupRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRejectDialog = (requestId) => {
    setSelectedRequestId(requestId);
    setRejectionDialogOpen(true);
  };

  const handleRejectRequest = async () => {
    if (!selectedRequestId) return;
    
    try {
      setLoading(true);
      
      // Update the request status to rejected
      const requestRef = doc(db, 'wallet_topups', selectedRequestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        updatedAt: new Date(),
        adminNote: rejectionReason || 'Rejected by admin'
      });
      
      // Close dialog and reset state
      setRejectionDialogOpen(false);
      setRejectionReason('');
      setSelectedRequestId(null);
      
      // Refresh the list
      fetchTopupRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request: ' + error.message);
    } finally {
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Wallet Top-up Requests
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchTopupRequests} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#FFF9C4' }}>
            <CardContent>
              <Typography variant="h6" component="div">
                Pending Requests
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#E8F5E9' }}>
            <CardContent>
              <Typography variant="h6" component="div">
                Approved
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold">
                {stats.approved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#FFEBEE' }}>
            <CardContent>
              <Typography variant="h6" component="div">
                Rejected
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold">
                {stats.rejected}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                Total Requests
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Requests Table */}
      <TableContainer component={Paper}>
        <Table aria-label="top-up requests table">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Requested</TableCell>
              <TableCell>Screenshot</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : topupRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No top-up requests found
                </TableCell>
              </TableRow>
            ) : (
              topupRequests
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {request.userName || 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        ID: {request.userId.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold">
                        ₹{request.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(request.createdAt, { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewImage(request.screenshotUrl)}
                      >
                        View
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.status.toUpperCase()}
                        style={{
                          backgroundColor: statusColors[request.status]?.bg,
                          color: statusColors[request.status]?.color
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <>
                          <Tooltip title="Approve Request">
                            <IconButton
                              color="success"
                              onClick={() => handleApproveRequest(request.id)}
                            >
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject Request">
                            <IconButton
                              color="error"
                              onClick={() => handleOpenRejectDialog(request.id)}
                            >
                              <RejectIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {(request.status === 'approved' || request.status === 'rejected') && (
                        <Typography variant="caption" color="textSecondary">
                          {request.adminNote || 'No notes'}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={topupRequests.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Image Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
      >
        <DialogTitle>Payment Screenshot</DialogTitle>
        <DialogContent>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Payment Screenshot"
              style={{ width: '100%', maxHeight: '70vh' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog
        open={rejectionDialogOpen}
        onClose={() => setRejectionDialogOpen(false)}
      >
        <DialogTitle>Reject Top-up Request</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Rejection"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRejectRequest} color="error">
            Reject Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default WalletTopupRequests; 