import React from 'react';
import { InputAdornment } from '@material-ui/core';
import { DatePicker } from '@material-ui/pickers';
import useStyles from '../styles/styles';
import TextField from './TextField';
import { ReactComponent as DropdownIcon } from '../icons/dropdownRegular.svg';

interface DatepickerProps {
  event?: Event;
  eventForm: any;
  onChange: (date?: any) => void;
}

const Datepicker = ({ event, eventForm, onChange }: DatepickerProps) => {
  const classes = useStyles();
  return (
    <DatePicker
      autoOk
      className={classes.dateInput}
      disableToolbar
      disablePast={event ? false : true}
      variant="inline"
      format="M/d/yyyy"
      value={eventForm.startDate}
      inputVariant="outlined"
      onChange={onChange}
      TextFieldComponent={props => (
        <TextField
          {...props}
          size="small"
          variant="outlined"
          label="Start Date"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <DropdownIcon />
              </InputAdornment>
            ),
          }}
        />
      )}
    />
  );
};

export default Datepicker;
