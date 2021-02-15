import React from 'react';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { Button, FormControlLabel, Grid, Switch, Box } from '@material-ui/core';
import DateFnsUtils from '@date-io/date-fns';
import moment from 'moment';
import { Link } from 'react-router-dom';

import useStyles from './styles/styles';
import TextField from './TextField';
import { ReactComponent as ErrorOutlineIcon } from '../icons/errorOutline.svg';
import Datepicker from './Datepicker';
import { PdfPreview } from '.';
import NumberFormatTime from '../common/NumberFormatTime';
import ChipsInput from './ChipsInput';
import EventFormNotifications from './EventFormNotifications';
import { ReactComponent as FileIcon } from '../icons/fileIcon.svg';

const PickersProvider = ({
  eventForm,
  dispatch,
  event,
  handleStartDateChange,
  allDay,
  handleAllDay,
  calendarChips,
  hasGraphQlConflictError,
  link,
  setOpen,
  message,
  messageTitle,
  sharingUsers,
  files,
  handleChipClick,
  setFiles,
  previewOpen,
  setPreviewOpen,
  currentAttachmentIndex,
  setCurrentAttachmentIndex,
}) => {
  const classes = useStyles();
  const convertTimeStringToNumber = (timeString: string) =>
    timeString.split(':').join('');

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Grid
        className={classes.headerPart}
        container
        spacing={2}
        alignItems="center"
      >
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            label="Title"
            value={eventForm.title}
            onChange={(e: React.FormEvent<HTMLFormElement>) =>
              dispatch({
                field: 'title',
                value: e.currentTarget.value,
              })
            }
          />
        </Grid>
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
          <div className={`${classes.dateCol} ${classes.paddingBottom}`}>
            To
          </div>
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
      </Grid>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={9}>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            label="Calendar"
            value={calendarChips}
          />
        </Grid>
        <Grid
          item
          container
          xs={3}
          alignItems="center"
          className={hasGraphQlConflictError() ? classes.conflictError : ''}
        >
          <Box display="flex" mt={4}>
            <ErrorOutlineIcon className={classes.icon} />
            &nbsp;
            {event?.conflict || hasGraphQlConflictError() ? (
              <>Has conflict.</>
            ) : (
              <>No Conflict</>
            )}
          </Box>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            label="Address"
            value={eventForm.location}
            onChange={(e: React.FormEvent<HTMLFormElement>) =>
              dispatch({
                field: 'location',
                value: e.currentTarget.value,
              })
            }
          />
        </Grid>
        <Grid item xs={12}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={6}>
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
            </Grid>
            <Grid item xs={6}>
              <ChipsInput
                value={
                  event?.message?.tags?.map(tag => tag.name) ||
                  message?.tags.map(tag => tag.name) ||
                  []
                }
                label="Category:"
                isLineType
                borderType="square"
                withBorder
              />
            </Grid>
          </Grid>
        </Grid>
        <EventFormNotifications
          eventForm={eventForm}
          sharingUsers={sharingUsers}
          dispatch={dispatch}
        />
        <Grid item xs={12}>
          <Button
            className={classes.addReminder}
            onClick={() => {
              dispatch({
                field: `notification:0:add`,
              });
            }}
            disableRipple
          >
            Add Reminder
          </Button>
        </Grid>
        {files ? (
          <>
            <Grid item xs={12}>
              <ChipsInput
                isLineType
                type="files"
                label="Attached File:"
                borderType="square"
                onClick={handleChipClick}
                value={files.map(attachment => attachment?.name || '') || []}
                icon={<FileIcon width={13} height={13} />}
                onDeleteChip={index =>
                  setFiles([
                    ...files.slice(0, index),
                    ...files.slice(index + 1),
                  ])
                }
              />
              {files ? (
                <PdfPreview
                  open={previewOpen}
                  setOpen={setPreviewOpen}
                  files={files as File[]}
                  selectedFileIndex={currentAttachmentIndex}
                  setFileIndex={setCurrentAttachmentIndex}
                />
              ) : null}
            </Grid>
          </>
        ) : null}
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            label="Note"
            multiline
            rows={5}
            value={eventForm.description}
            onChange={(e: React.FormEvent<HTMLFormElement>) =>
              dispatch({
                field: 'description',
                value: e.currentTarget.value,
              })
            }
          />
        </Grid>
      </Grid>
    </MuiPickersUtilsProvider>
  );
};

export default PickersProvider;
