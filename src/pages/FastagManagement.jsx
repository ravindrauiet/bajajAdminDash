import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import FastagManagement from '../components/FastagManagement';

function FastagManagementPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          FasTag Inventory Management
        </Typography>
        <FastagManagement />
      </Box>
    </Container>
  );
}

export default FastagManagementPage; 