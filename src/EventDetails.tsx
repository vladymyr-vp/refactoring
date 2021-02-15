import React, { useReducer, useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  IconButton,
  Box,
} from '@material-ui/core';

import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';

import { CloseOutlined as CloseOutlinedIcon } from '@material-ui/icons';
import 'date-fns';
import moment from 'moment';

import {
  File,
  useUpdateEventMutation,
  useCreateEventMutation,
  useDeleteEventMutation,
  useGetSharedAccessQuery,
  User,
  Calendar,
  EventDocument,
  useGetNotificationSettingsByTagLazyQuery,
  GetSharedAccessQuery,
} from '../graphql/generated';

import convertMStoTimeLeft from '../common/convertMSToTimeLeft';

import EventDeleteModal from './components/EventDeleteModal';

import useStyles from './styles/styles';
import { EventDetailsProps, NotificationItem, PeriodType } from './types/types';

import { createLink, normaliseEventFormHelper } from '../common/helper';
import { messageFragment } from '../graphql/generated';
import { initialEventForm as initialEventFormWithProps } from '../common/helper';
import { reducer as reducerWithProps } from '../common/reducers';
import TextField from './components/TextField';
import { ReactComponent as ErrorOutlineIcon } from '../icons/errorOutline.svg';
import ChipsInput from './components/ChipsInput';
import EventFormNotifications from './components/EventFormNotifications';
import AttachPDF from './components/AttachPDF';
import LinkElement from './components/Link';
import DateRow from './components/DateRow';
import ActionsButtons from './components/ActionsButtons';
import SnackBarElement from './components/SnackBarElement';

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

  const normaliseEventForm = normaliseEventFormHelper({
    eventForm,
    allDay,
    files,
  });

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

  const link = createLink(
    currentUser.email,
    messageId,
    isMessageDone,
    isMessageDeleted,
  );

  const handleClose = () => setIsOpenModalConfirm(false);

  return (
    <>
      <SnackBarElement
        successMessageOpen={successMessageOpen}
        setSuccessMessageOpen={setSuccessMessageOpen}
      />
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
                <DateRow
                  event={event}
                  eventForm={eventForm}
                  handleStartDateChange={handleStartDateChange}
                  dispatch={dispatch}
                  handleAllDay={handleAllDay}
                />
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
                  className={
                    hasGraphQlConflictError() ? classes.conflictError : ''
                  }
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
                      <LinkElement
                        link={link}
                        setOpen={setOpen}
                        messageTitle={messageTitle}
                        message={message}
                        event={event}
                      />
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
                <AttachPDF
                  files={files}
                  handleChipClick={handleChipClick}
                  previewOpen={previewOpen}
                  setFiles={setFiles}
                  setPreviewOpen={setPreviewOpen}
                  currentAttachmentIndex={currentAttachmentIndex}
                  setCurrentAttachmentIndex={setCurrentAttachmentIndex}
                />
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

            <ActionsButtons
              setIsOpenModalConfirm={setIsOpenModalConfirm}
              updateLoading={updateLoading}
              createLoading={}
            />
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
