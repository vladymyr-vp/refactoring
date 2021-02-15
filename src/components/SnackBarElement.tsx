import React from 'react';
import { Snackbar } from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';

const SnackBarElement = ({ successMessageOpen, setSuccessMessageOpen }) => {
  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      open={successMessageOpen}
      autoHideDuration={3000}
      onClose={() => setSuccessMessageOpen(false)}
    >
      <MuiAlert severity="success">Event has been saved</MuiAlert>
    </Snackbar>
  );
};

export default SnackBarElement;
