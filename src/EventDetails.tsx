import React, { useReducer, useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControlLabel,
  Grid,
  Switch,
  TextField as TextFieldMaterial,
  IconButton,
  CircularProgress,
  Snackbar,
  Box,
} from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';

import { CloseOutlined as CloseOutlinedIcon } from '@material-ui/icons';

import { PdfPreview } from '.';

import { MuiPickersUtilsProvider } from '@material-ui/pickers';

import 'date-fns';
import DateFnsUtils from '@date-io/date-fns';
import moment from 'moment';
import { ReactComponent as ErrorOutlineIcon } from '../icons/errorOutline.svg';
import { ReactComponent as FileIcon } from '../icons/fileIcon.svg';

import {
  File,
  UpdateEventInput,
  useUpdateEventMutation,
  useCreateEventMutation,
  useDeleteEventMutation,
  useGetSharedAccessQuery,
  User,
  Calendar,
  EventDocument,
  useGetNotificationSettingsByTagLazyQuery,
  EventNotificationInput,
  GetSharedAccessQuery,
} from '../graphql/generated';

import convertMStoTimeLeft from '../common/convertMSToTimeLeft';

import TextField from './TextField';
import ChipsInput from './ChipsInput';

import NumberFormatTime from '../common/NumberFormatTime';
import { Link } from 'react-router-dom';
import EventDeleteModal from './EventDeleteModal';

import useStyles from './styles/styles';
import {
  EventDetailsProps,
  EventForm,
  NotificationItem,
  ActionType,
  PeriodType,
} from './types/types';
import { periodRate } from '../common/periodTypes';
import { createLink } from '../common/helper';
import { messageFragment } from '../graphql/generated';
import { initialEventForm as initialEventFormWithProps } from '../common/helper';
import { reducer as reducerWithProps } from '../common/reducers';
import Datepicker from './Datepicker';
import EventFormNotifications from './EventFormNotifications';
import PickersProvider from './PickersProvider';

const EventDetails = ({
  event,
  open,
  setOpen,
  onDialogClose,
  refetchEvents,
  message,
  onEventCreation,
  onEventDelition,
  onCreateEventFromMessageItem,
  currentUser,
  messageId,
  messageTitle,
  isMessageDone,
  isMessageDeleted,
}: EventDetailsProps) => {
  const {
    data: sharedData,
    loading: sharedDataLoading,
  } = useGetSharedAccessQuery();

  const classes = useStyles();

  const [
    updateEventMutation,
    { data: updateEventData, loading: updateLoading, error: updateError },
  ] = useUpdateEventMutation();
  const [
    getNotificationSettings,
    { data: notificationSettingsData },
  ] = useGetNotificationSettingsByTagLazyQuery();

  const [deleteEventMutation] = useDeleteEventMutation({
    onCompleted: async () => {
      if (refetchEvents) {
        refetchEvents();
      }
      if (onEventDelition) {
        await onEventDelition();
      }
      setOpen(false);
    },
    update(cache, { data }) {
      const { deleteEvent } = data || {};
      if (deleteEvent && event) {
        cache.writeQuery({
          query: EventDocument,
          data: {
            event: null,
          },
          variables: { eventId: event.id },
        });
        cache.writeFragment({
          id: 'Message:' + message?.id,
          fragment: messageFragment,
          data: {
            event: null,
          },
        });
      }
    },
  });

  const now = moment();
  const oneHourFuture = moment(now).add(1, 'hours');
  const nowDateEndDate =
    Number(moment(now).format('HH')) >= 23 ? moment(now).add(1, 'day') : now;
  const [allDay, setAllDay] = useState<boolean>(false);
  const [isOpenModalConfirm, setIsOpenModalConfirm] = useState<boolean>(false);
  const [allDayBufferStartTime, setAllDayBufferStartTime] = useState('00:00');
  const [allDayBufferEndTime, setAllDayBufferEndTime] = useState('23:59');
  const [calendarChips, setCalendarChips] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<object[]>([]);
  const [sharingUsers, setSharingUsers] = useState<User[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [sharedDataAccess, setSharedDataAccess] = useState<
    GetSharedAccessQuery | undefined | null
  >(null);

  const initialEventForm = initialEventFormWithProps(
    message,
    now,
    oneHourFuture,
    nowDateEndDate,
    notifications,
    event,
  );

  const reducer = (
    state: any,
    { field, value }: { field: string; value?: string },
  ) =>
    reducerWithProps(
      state,
      { field, value },
      initialEventForm,
      oneHourFuture,
      now,
      event,
    );

  const [eventForm, dispatch] = useReducer(reducer, initialEventForm);

  useEffect(() => {
    setSharedDataAccess(sharedData);
  }, [sharedData]);

  useEffect(() => {
    dispatch({
      field: 'reset',
    });
  }, [event, notifications, sharingUsers]);

  useEffect(() => {
    if (message?.tags?.length) {
      getNotificationSettings({ variables: { tagId: message.tags[0].id } });
    }
  }, [message, getNotificationSettings]);

  const [
    createEventMutation,
    { data: createEventData, loading: createLoading, error: createError },
  ] = useCreateEventMutation({
    update(cache, { data }) {
      const { createEvent } = data || {};
      if (createEvent) {
        cache.writeQuery({
          query: EventDocument,
          data: {
            event: createEvent,
          },
          variables: { eventId: createEvent.id },
        });
        cache.writeFragment({
          id: 'Message:' + message?.id,
          fragment: messageFragment,
          data: {
            event: createEvent,
          },
        });
      }
    },
  });

  const hasGraphQlConflictError = () => {
    if (createError?.graphQLErrors && createError?.graphQLErrors.length > 0) {
      const error = createError.graphQLErrors[0] as any;
      if (error.code === 'has_conflict') {
        return true;
      }
    }

    if (updateError?.graphQLErrors && updateError?.graphQLErrors.length > 0) {
      const error = updateError.graphQLErrors[0] as any;
      if (error.code === 'has_conflict') {
        return true;
      }
    }

    return false;
  };

  const normaliseEventForm = (): UpdateEventInput => {
    const startTime = moment(
      `${eventForm.startDate} ${eventForm.startTime}`,
      'l HH:mm',
    ).format();

    const endTime = moment(
      `${eventForm.endDate} ${eventForm.endTime}`,
      'l HH:mm',
    ).format();

    let startTimeUTC = startTime;
    let endTimeUTC = endTime;
    // Converting dates to UTC for all day,
    // because nylas shows wrong date range with local time
    if (allDay) {
      startTimeUTC = moment(startTime).utcOffset(0, true).format();
      endTimeUTC = moment(endTime).utcOffset(0, true).format();
    }

    const normalizedNotifications: EventNotificationInput[] = [];

    eventForm.notifications.forEach((item: NotificationItem) => {
      if (item?.period && Number(item?.period) > 0 && item.userId !== 'none') {
        normalizedNotifications.push({
          userId: item.userId,
          notifyBefore: Number(item.period) * periodRate[item.periodType],
        });
      }
    });

    return {
      title: eventForm.title,
      startTime: startTimeUTC,
      endTime: endTimeUTC,
      location: eventForm.location,
      description: eventForm.description,
      notifications: normalizedNotifications,
      attachmentIds: files.map(attach => attach.id),
    };
  };
  const handleFormSave = async (eventDom: React.FormEvent<HTMLFormElement>) => {
    eventDom.preventDefault();

    const {
      title,
      startTime,
      endTime,
      location,
      description,
      notifications,
      attachmentIds,
    } = normaliseEventForm();

    if (event) {
      await updateEventMutation({
        variables: {
          eventId: event.id,
          title,
          startTime,
          endTime,
          location,
          description,
          allDay,
          notifications,
          attachmentIds,
        },
      }).catch(err => console.log(`Event update error: ${err}`));
    } else if (message) {
      try {
        // TODO: Fix the types. In rush atm to demo this
        const newEvent: any = await createEventMutation({
          variables: {
            messageId: message.id,
            title,
            startTime,
            endTime,
            location,
            description,
            allDay,
            notifications,
            attachmentIds,
          },
        });
        const data = newEvent.data;

        const hasConflict = hasGraphQlConflictError();
        if (hasConflict) {
          return;
        }

        if (data?.createEvent && onCreateEventFromMessageItem) {
          onCreateEventFromMessageItem(data.createEvent.id, data?.createEvent);
        }
        if (data?.createEvent && onEventCreation) {
          await onEventCreation(data.createEvent.id, data?.createEvent);
        }
      } catch (error) {
        console.log(`Event update error: ${error}`);
      }
    } else {
      return;
    }
    if (!createError && !updateError) {
      if (refetchEvents) {
        refetchEvents();
      }
      if (onDialogClose) {
        onDialogClose();
      }
    }
  };

  const handleDeleteEvent = async () => {
    if ('id' in eventForm) {
      setIsOpenModalConfirm(false);
      await deleteEventMutation({
        variables: {
          eventId: eventForm.id,
        },
      });
    }
  };

  const [successMessageOpen, setSuccessMessageOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = React.useState(0);

  useEffect(() => {
    if (updateEventData && !updateError) {
      setSuccessMessageOpen(true);
      setOpen(false);
    }
  }, [updateEventData, updateError, setOpen]);

  useEffect(() => {
    const eventFiles = event?.attachments || message?.files || [];
    if (eventFiles) {
      setFiles(eventFiles as File[]);
    } else {
      setFiles([]);
    }
  }, [event, message]);

  useEffect(() => {
    if (createEventData && !createError) {
      setSuccessMessageOpen(true);
      setOpen(false);
    }
  }, [createEventData, createError, setOpen]);

  useEffect(() => {
    const chipSharedAccessValues: string[] = sharedDataAccess?.sharedAccess
      ?.targetUsers
      ? sharedDataAccess.sharedAccess.targetUsers.map(
          (user: User) => `${user?.name}'s Calendar`,
        )
      : [];

    let userCalendars: string[] = [];
    if (currentUser) {
      userCalendars =
        currentUser.eventCalendars.map(
          (calendar: Calendar) => `${calendar.name}`,
        ) || [];
    }

    const chipValues = [...chipSharedAccessValues, ...userCalendars];
    if (event?.nylasCalendarName) {
      chipValues.unshift(event.nylasCalendarName);
    }
    setCalendarChips(chipValues);
  }, [event, sharedDataAccess, currentUser]);

  useEffect(() => {
    if (!sharedDataLoading && sharedData?.sharedAccess?.targetUsers) {
      let sharedUsers: User[] = [];

      if (sharedData?.sharedAccess?.targetUsers) {
        sharedUsers = [...sharedData?.sharedAccess?.targetUsers];
        const isInclude = sharedUsers.find(({ id }) => id === currentUser.id);
        if (!isInclude) {
          sharedUsers.unshift(currentUser);
        }
      }

      const initialNotificationPeriod: NotificationItem[] = [];

      const periodTypeMap = {
        weeks: 'Week',
        days: 'Day',
        hours: 'Hour',
        minutes: 'Minute',
      };

      if (!event) {
        if (
          notificationSettingsData?.notificationSettingsByTag?.items &&
          notificationSettingsData?.notificationSettingsByTag?.items?.length > 0
        ) {
          notificationSettingsData.notificationSettingsByTag.items.forEach(
            item => {
              const { type, value } = convertMStoTimeLeft(item.notifyBefore);
              const tsType = type as keyof typeof periodTypeMap;
              sharedUsers.forEach(sharedUser => {
                initialNotificationPeriod.push({
                  userId: sharedUser.id,
                  periodType: periodTypeMap[tsType] as PeriodType,
                  period: value.toString(),
                });
              });
            },
          );
        } else {
          sharedUsers.forEach(sharedUser => {
            initialNotificationPeriod.push({
              userId: sharedUser.id,
              periodType: periodTypeMap.minutes as PeriodType,
              period: '10',
            });
          });
        }
      } else if (event?.notifications && event?.notifications?.length > 0) {
        event.notifications.forEach(notififcation => {
          const { type, value } = convertMStoTimeLeft(
            notififcation.notifyBefore,
          );
          const tsType = type as keyof typeof periodTypeMap;
          initialNotificationPeriod.push({
            userId: notififcation.userId,
            periodType: periodTypeMap[tsType] as PeriodType,
            period: value.toString(),
          });
        });
      }
      setNotifications(initialNotificationPeriod);
      setSharingUsers(sharedUsers);
    }
  }, [
    event,
    sharedDataLoading,
    notificationSettingsData,
    currentUser,
    sharedData,
  ]);

  const handleDialogClose = () => {
    setOpen(false);
    if (onDialogClose) {
      onDialogClose();
    }
  };

  const handleChipClick = (attachmentIndex: number) => {
    setCurrentAttachmentIndex(attachmentIndex);
    setPreviewOpen(true);
  };

  const handleAllDay = () => {
    if (allDay) {
      setAllDay(false);
      dispatch({
        field: 'startTime',
        value: allDayBufferStartTime,
      });
      dispatch({
        field: 'endTime',
        value: allDayBufferEndTime,
      });
    } else {
      const isAfter = moment(moment(eventForm.startDate).format('l')).isAfter(
        eventForm.endDate,
      );

      if (isAfter) {
        dispatch({
          field: 'endDate',
          value: eventForm.startDate,
        });
      }

      setAllDay(true);
      setAllDayBufferStartTime(eventForm.startTime);
      setAllDayBufferEndTime(eventForm.endTime);

      dispatch({
        field: 'startTime',
        value: '00:00',
      });
      dispatch({
        field: 'endTime',
        value: '23:59',
      });
    }
  };

  const handleStartDateChange = (date: any) => {
    if (!date) return;
    const isAfter = moment(moment(date).format('l')).isAfter(eventForm.endDate);

    if (allDay && isAfter) {
      dispatch({
        field: 'endDate',
        value: moment(date).format('l'),
      });
    }
    dispatch({
      field: 'startDate',
      value: moment(date).format('l'),
    });
  };

  // 16:00 => 1600 for number mask
  const convertTimeStringToNumber = (timeString: string) =>
    timeString.split(':').join('');

  const link = createLink(
    currentUser.email,
    messageId,
    isMessageDone,
    isMessageDeleted,
  );

  const handleClose = () => setIsOpenModalConfirm(false);

  return (
    <>
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
      <Dialog
        classes={{
          paper: classes.modal,
        }}
        open={open}
        onClose={handleDialogClose}
      >
        <DialogTitle className={classes.modalTitle}>
          <Grid container justify="space-between" alignItems="center">
            <Grid item>{message ? 'Create new event' : 'Event Details'}</Grid>
            <Grid item>
              <IconButton
                classes={{
                  root: classes.iconButtonRoot,
                }}
                onClick={() => setOpen(false)}
              >
                <CloseOutlinedIcon />
              </IconButton>
            </Grid>
          </Grid>
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleFormSave}>
            <PickersProvider
              eventForm={eventForm}
              dispatch={dispatch}
              event={event}
              handleStartDateChange={handleStartDateChange}
              allDay={allDay}
              handleAllDay={handleAllDay}
              calendarChips={calendarChips}
              hasGraphQlConflictError={hasGraphQlConflictError}
              link={link}
              setOpen={setOpen}
              message={message}
              messageTitle={messageTitle}
              sharingUsers={sharingUsers}
              files={files}
              handleChipClick={handleChipClick}
              setFiles={setFiles}
              previewOpen={previewOpen}
              setPreviewOpen={setPreviewOpen}
              currentAttachmentIndex={currentAttachmentIndex}
              setCurrentAttachmentIndex={setCurrentAttachmentIndex}
            />

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
          </form>
        </DialogContent>
      </Dialog>
      <EventDeleteModal
        isOpenModalConfirm={isOpenModalConfirm}
        handleClose={handleClose}
        handleDeleteEvent={handleDeleteEvent}
      />
    </>
  );
};

export default EventDetails;
