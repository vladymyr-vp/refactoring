import React from 'react';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { FormControlLabel, Switch } from '@material-ui/core';
import DateFnsUtils from '@date-io/date-fns';
import moment from 'moment';

import useStyles from '../styles/styles';
import TextField from './TextField';
import Datepicker from './Datepicker';
import NumberFormatTime from '../../common/NumberFormatTime';

const DateRow = ({
  event,
  eventForm,
  handleStartDateChange,
  dispatch,
  handleAllDay,
}) => {
  const classes = useStyles();
  const convertTimeStringToNumber = (timeString: string) =>
    timeString.split(':').join('');

  return (
    <div className={classes.dateRow}>
      <div className={classes.dateCol}>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <Datepicker
            event={event}
            eventForm={eventForm}
            onChange={handleStartDateChange}
          />
        </MuiPickersUtilsProvider>
      </div>
      <div className={classes.dateCol}>
        <TextField
          className={classes.timeInput}
          required
          size="small"
          label="Start Time"
          variant="outlined"
          value={convertTimeStringToNumber(eventForm.startTime)}
          InputProps={{
            inputComponent: NumberFormatTime as any,
          }}
          onChange={(e: any) =>
            dispatch({
              field: 'startTime',
              value: e.target.value,
            })
          }
        />
      </div>
      <div className={`${classes.dateCol} ${classes.paddingBottom}`}>To</div>
      <div className={classes.dateCol}>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <Datepicker
            event={event}
            eventForm={eventForm}
            onChange={date => {
              if (!date) return;
              dispatch({
                field: 'endDate',
                value: moment(date).format('l'),
              });
            }}
          />
        </MuiPickersUtilsProvider>
      </div>
      <div className={classes.dateCol}>
        <TextField
          className={classes.timeInput}
          required
          size="small"
          label="End Time"
          variant="outlined"
          value={convertTimeStringToNumber(eventForm.endTime)}
          InputProps={{
            inputComponent: NumberFormatTime as any,
          }}
          onChange={(e: any) =>
            dispatch({
              field: 'endTime',
              value: e.target.value,
            })
          }
        />
      </div>
      <div className={`${classes.dateCol} ${classes.paddingBottom}`}>
        <FormControlLabel
          control={
            <Switch
              classes={{
                root: classes.switchRoot,
                switchBase: classes.switchBase,
                thumb: classes.switchThumb,
                track: classes.switchTrack,
              }}
              checked={allDay}
              color="primary"
              onClick={handleAllDay}
            />
          }
          label="All Day"
        />
      </div>
    </div>
  );
};

export default DateRow;
