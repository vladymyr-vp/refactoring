import React from 'react';

import useStyles from '../styles/styles';
import TextField from './TextField';
import { Link } from 'react-router-dom';

const LinkElement = ({ link, setOpen, messageTitle, message, event }) => {
  const classes = useStyles();
  return (
    <Link className={classes.linkStyles} to={link}>
      <TextField
        onClick={() => setOpen(false)}
        fullWidth
        size="small"
        variant="outlined"
        label="Mail"
        InputProps={{
          className: classes.multilineColor,
        }}
        value={
          messageTitle ||
          message?.caseStyle ||
          message?.subject ||
          event?.message?.caseStyle ||
          ''
        }
      />
    </Link>
  );
};

export default LinkElement;
