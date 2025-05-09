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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { getFirestore, collection, query, where, orderBy, limit, getDocs, startAfter, doc, getDoc } from 'firebase/firestore';

const FastagRegistrationHistory = () => {
  const db = getFirestore();
  
  // State variables
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [lastVisible, setLastVisible] = useState(null);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    mobileNo: '',
    vehicleNo: '',
    stage: '',
    dateRange: 'all'
  });

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async (reset = true) => {
    try {
      setLoading(true);
      
      // Build basic query
      let registrationsQuery = collection(db, 'fastagRegistrations');
      let constraints = [orderBy('updatedAt', 'desc')];
      
      // Apply filters
      if (filters.mobileNo) {
        constraints.push(where('mobileNo', '==', filters.mobileNo));
      }
      
      if (filters.vehicleNo) {
        constraints.push(where('vehicleNo', '==', filters.vehicleNo));
      }
      
      if (filters.stage) {
        constraints.push(where('currentStage', '==', filters.stage));
      }
      
      // Apply date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          default:
            // No date filter
            break;
        }
        
        constraints.push(where('updatedAt', '>=', startDate));
      }
      
      // Add pagination
      constraints.push(limit(rowsPerPage));
      
      // Add startAfter for pagination if not resetting
      if (lastVisible && !reset) {
        const lastDoc = await getDoc(doc(db, 'fastagRegistrations', lastVisible));
        if (lastDoc.exists()) {
          constraints.push(startAfter(lastDoc));
        }
      }
      
      registrationsQuery = query(registrationsQuery, ...constraints);
      
      // Execute query
      const snapshot = await getDocs(registrationsQuery);
      const registrationsList = [];
      
      snapshot.forEach(doc => {
        registrationsList.push({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamp to Date
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          startedAt: doc.data().startedAt?.toDate() || new Date()
        });
      });
      
      // Set last visible for pagination
      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1].id);
      } else {
        setLastVisible(null);
      }
      
      // Get total count (simplified approach)
      const countConstraints = constraints.filter(c => c.type !== 'limit' && c.type !== 'startAfter');
      const countQuery = query(collection(db, 'fastagRegistrations'), ...countConstraints);
      const countSnapshot = await getDocs(countQuery);
      setTotalRegistrations(countSnapshot.size);
      
      // Update registrations state
      setRegistrations(reset ? registrationsList : [...registrations, ...registrationsList]);
      setPage(reset ? 0 : page);
    } catch (error) {
      console.error('Error fetching FasTag registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    if (newPage > page) {
      // Fetch more data when going to next page
      fetchRegistrations(false);
    }
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    fetchRegistrations(true);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = () => {
    setPage(0);
    fetchRegistrations(true);
  };

  const handleRegistrationClick = (registration) => {
    setSelectedRegistration(registration);
    setDetailsOpen(true);
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleString();
  };

  const getStageChip = (stage) => {
    let color = 'default';
    let label = stage;
    
    switch (stage) {
      case 'validate-customer':
        color = 'primary';
        label = 'Customer Validation';
        break;
      case 'validate-otp':
        color = 'secondary';
        label = 'OTP Validation';
        break;
      case 'document-upload':
        color = 'info';
        label = 'Document Upload';
        break;
      case 'manual-activation':
        color = 'warning';
        label = 'Manual Activation';
        break;
      case 'fastag-registration':
        color = 'success';
        label = 'FasTag Registration';
        break;
      default:
        color = 'default';
        label = stage || 'Unknown';
    }
    
    return (
      <Chip 
        label={label} 
        color={color} 
        size="small" 
      />
    );
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        FasTag Registration History
      </Typography>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2.5}>
            <TextField
              fullWidth
              size="small"
              label="Mobile Number"
              name="mobileNo"
              value={filters.mobileNo}
              onChange={handleFilterChange}
            />
          </Grid>
          
          <Grid item xs={12} md={2.5}>
            <TextField
              fullWidth
              size="small"
              label="Vehicle Number"
              name="vehicleNo"
              value={filters.vehicleNo}
              onChange={handleFilterChange}
            />
          </Grid>
          
          <Grid item xs={12} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Registration Stage</InputLabel>
              <Select
                name="stage"
                value={filters.stage}
                onChange={handleFilterChange}
                label="Registration Stage"
              >
                <MenuItem value="">All Stages</MenuItem>
                <MenuItem value="validate-customer">Customer Validation</MenuItem>
                <MenuItem value="validate-otp">OTP Validation</MenuItem>
                <MenuItem value="document-upload">Document Upload</MenuItem>
                <MenuItem value="manual-activation">Manual Activation</MenuItem>
                <MenuItem value="fastag-registration">FasTag Registration</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Range</InputLabel>
              <Select
                name="dateRange"
                value={filters.dateRange}
                onChange={handleFilterChange}
                label="Date Range"
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={applyFilters}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Table */}
      <Paper>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6">
            Registration Records
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => fetchRegistrations(true)}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
        
        <TableContainer component={Paper}>
          {loading && page === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Vehicle No</TableCell>
                  <TableCell>Mobile No</TableCell>
                  <TableCell>Current Stage</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No registration records found
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(registration => (
                    <TableRow key={registration.id}>
                      <TableCell>{registration.vehicleNo || 'N/A'}</TableCell>
                      <TableCell>{registration.mobileNo || 'N/A'}</TableCell>
                      <TableCell>{getStageChip(registration.currentStage)}</TableCell>
                      <TableCell>
                        {registration.user ? (
                          <Tooltip title={registration.user.email || 'Unknown'}>
                            <span>{registration.user.displayName || registration.user.email || 'Unknown'}</span>
                          </Tooltip>
                        ) : (
                          'Anonymous'
                        )}
                      </TableCell>
                      <TableCell>{formatDate(registration.startedAt)}</TableCell>
                      <TableCell>{formatDate(registration.updatedAt)}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleRegistrationClick(registration)}
                        >
                          <InfoIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {loading && page > 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalRegistrations}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Paper>
      
      {/* Registration Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Registration Details
          {selectedRegistration?.vehicleNo && ` - ${selectedRegistration.vehicleNo}`}
        </DialogTitle>
        <DialogContent dividers>
          {selectedRegistration && (
            <Box>
              {/* Basic Information */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2">Vehicle Number</Typography>
                    <Typography>{selectedRegistration.vehicleNo || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2">Mobile Number</Typography>
                    <Typography>{selectedRegistration.mobileNo || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2">Current Stage</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {getStageChip(selectedRegistration.currentStage)}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Started At</Typography>
                    <Typography>{formatDate(selectedRegistration.startedAt)}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Last Updated</Typography>
                    <Typography>{formatDate(selectedRegistration.updatedAt)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">User</Typography>
                    <Typography>
                      {selectedRegistration.user ? (
                        <>
                          Name: {selectedRegistration.user.displayName || 'N/A'}<br />
                          Email: {selectedRegistration.user.email || 'N/A'}<br />
                          UID: {selectedRegistration.user.uid || 'N/A'}
                        </>
                      ) : (
                        'Anonymous'
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              {/* Stages Information */}
              <Typography variant="h6" gutterBottom>Registration Stages</Typography>
              
              {/* Customer Validation Stage */}
              {selectedRegistration.stages && selectedRegistration.stages['validate-customer'] && (
                <Accordion
                  expanded={expanded === 'validate-customer'}
                  onChange={handleAccordionChange('validate-customer')}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <Typography>{getStageChip('validate-customer')}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {formatDate(selectedRegistration.stages['validate-customer'].stageCompletedAt?.toDate())}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ pl: 2 }}>
                      {renderStageData(selectedRegistration.stages['validate-customer'].data)}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
              
              {/* OTP Validation Stage */}
              {selectedRegistration.stages && selectedRegistration.stages['validate-otp'] && (
                <Accordion
                  expanded={expanded === 'validate-otp'}
                  onChange={handleAccordionChange('validate-otp')}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <Typography>{getStageChip('validate-otp')}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {formatDate(selectedRegistration.stages['validate-otp'].stageCompletedAt?.toDate())}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ pl: 2 }}>
                      {renderStageData(selectedRegistration.stages['validate-otp'].data)}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
              
              {/* Document Upload Stage */}
              {selectedRegistration.stages && selectedRegistration.stages['document-upload'] && (
                <Accordion
                  expanded={expanded === 'document-upload'}
                  onChange={handleAccordionChange('document-upload')}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <Typography>{getStageChip('document-upload')}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {formatDate(selectedRegistration.stages['document-upload'].stageCompletedAt?.toDate())}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ pl: 2 }}>
                      {renderStageData(selectedRegistration.stages['document-upload'].data)}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
              
              {/* Manual Activation Stage */}
              {selectedRegistration.stages && selectedRegistration.stages['manual-activation'] && (
                <Accordion
                  expanded={expanded === 'manual-activation'}
                  onChange={handleAccordionChange('manual-activation')}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <Typography>{getStageChip('manual-activation')}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {formatDate(selectedRegistration.stages['manual-activation'].stageCompletedAt?.toDate())}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ pl: 2 }}>
                      {renderStageData(selectedRegistration.stages['manual-activation'].data)}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
              
              {/* Fastag Registration Stage */}
              {selectedRegistration.stages && selectedRegistration.stages['fastag-registration'] && (
                <Accordion
                  expanded={expanded === 'fastag-registration'}
                  onChange={handleAccordionChange('fastag-registration')}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <Typography>{getStageChip('fastag-registration')}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {formatDate(selectedRegistration.stages['fastag-registration'].stageCompletedAt?.toDate())}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ pl: 2 }}>
                      {renderStageData(selectedRegistration.stages['fastag-registration'].data)}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Helper function to render stage data
const renderStageData = (data) => {
  if (!data) return <Typography>No data available</Typography>;
  
  const excludeKeys = ['apiResponse']; // Skip large API response data
  
  return (
    <Grid container spacing={2}>
      {Object.entries(data).map(([key, value]) => {
        // Skip excluded keys and complex objects unless they're important
        if (excludeKeys.includes(key) || (typeof value === 'object' && value !== null && !Array.isArray(value) && key !== 'documentDetails' && key !== 'uploadedDocs' && key !== 'registrationData' && key !== 'finalRegistrationData')) {
          return null;
        }
        
        let displayValue = value;
        
        // Handle special object types
        if (key === 'documentDetails' || key === 'uploadedDocs') {
          return (
            <Grid item xs={12} key={key}>
              <Typography variant="subtitle2">{formatKey(key)}</Typography>
              <Box sx={{ pl: 2 }}>
                {Object.entries(value).map(([docKey, docValue]) => (
                  <Typography key={docKey} variant="body2">
                    {formatKey(docKey)}: {docValue.toString()}
                  </Typography>
                ))}
              </Box>
            </Grid>
          );
        }
        
        // Handle nested registrationData
        if (key === 'registrationData' || key === 'finalRegistrationData') {
          return (
            <Grid item xs={12} key={key}>
              <Typography variant="subtitle2">{formatKey(key)}</Typography>
              <Box sx={{ pl: 2 }}>
                {Object.entries(value).map(([subKey, subValue]) => {
                  if (typeof subValue === 'object' && subValue !== null) {
                    return (
                      <Box key={subKey} sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {formatKey(subKey)}:
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          {Object.entries(subValue).map(([nestedKey, nestedValue]) => (
                            <Typography key={nestedKey} variant="body2">
                              {formatKey(nestedKey)}: {nestedValue.toString()}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    );
                  } else {
                    return (
                      <Typography key={subKey} variant="body2">
                        {formatKey(subKey)}: {subValue.toString()}
                      </Typography>
                    );
                  }
                })}
              </Box>
            </Grid>
          );
        }
        
        // Convert value to display string
        if (typeof value === 'boolean') {
          displayValue = value ? 'Yes' : 'No';
        } else if (value === null || value === undefined) {
          displayValue = 'N/A';
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          displayValue = JSON.stringify(value);
        } else if (Array.isArray(value)) {
          displayValue = value.join(', ');
        } else {
          displayValue = value.toString();
        }
        
        return (
          <Grid item xs={12} md={6} key={key}>
            <Typography variant="subtitle2">{formatKey(key)}</Typography>
            <Typography variant="body2" 
              sx={{ 
                wordBreak: 'break-word',
                maxHeight: displayValue.length > 100 ? '100px' : 'auto',
                overflow: displayValue.length > 100 ? 'auto' : 'visible' 
              }}
            >
              {displayValue}
            </Typography>
          </Grid>
        );
      })}
    </Grid>
  );
};

// Helper function to format keys for display
const formatKey = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');
};

export default FastagRegistrationHistory; 