import React from 'react';
import { Grid, Button, CircularProgress } from '@material-ui/core';
import useStyles from './styles/styles';

const ActionsButtons = ({
  setIsOpenModalConfirm,
  updateLoading,
  createLoading,
}) => {
  const classes = useStyles();
  return (
    <Grid
      className={classes.actions}
      container
      alignItems="center"
      justify="space-between"
    >
      <Grid item className={classes.lastUpdated}>
        {'Event update time goes here'}
      </Grid>
      <Grid item>
        <Button
          className={classes.deleteButton}
          onClick={() => setIsOpenModalConfirm(true)}
        >
          Delete
        </Button>
        <Button
          variant="contained"
          color="primary"
          disableElevation
          type="submit"
          disabled={updateLoading || createLoading}
        >
          {updateLoading ? <CircularProgress size={25} /> : 'Save'}
        </Button>
      </Grid>
    </Grid>
  );
};

export default ActionsButtons;
