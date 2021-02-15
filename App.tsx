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
  FormControl,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Snackbar,
  Box,
  InputAdornment,
} from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';

import { CloseOutlined as CloseOutlinedIcon } from '@material-ui/icons';

import { PdfPreview } from './';
import { makeStyles } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider, DatePicker } from '@material-ui/pickers';
import { red, blue } from '@material-ui/core/colors';

import 'date-fns';
import DateFnsUtils from '@date-io/date-fns';
import moment from 'moment';
import format from 'date-fns/format';
import isValid from 'date-fns/isValid';
import differenceInMinutes from 'date-fns/differenceInMinutes';
import addMinutes from 'date-fns/addMinutes';
import differenceInDays from 'date-fns/differenceInDays';
import addDays from 'date-fns/addDays';
import parse from 'date-fns/parse';
import { ReactComponent as ErrorOutlineIcon } from '../icons/errorOutline.svg';
import { ReactComponent as FileIcon } from '../icons/fileIcon.svg';

import {
  File,
  Event,
  UpdateEventInput,
  useUpdateEventMutation,
  useCreateEventMutation,
  useDeleteEventMutation,
  Maybe,
  Message,
  useGetSharedAccessQuery,
  User,
  Calendar,
  EventDocument,
  useGetNotificationSettingsByTagLazyQuery,
  EventNotificationInput,
  GetSharedAccessQuery,
} from '../graphql/generated';

import convertMStoTimeLeft from '../common/convertMSToTimeLeft';
import { gql } from '@apollo/client';

import TextField from './TextField';
import ChipsInput from './ChipsInput';
import { ReactComponent as DropdownIcon } from '../icons/dropdownRegular.svg';
import NumberFormatTime from '../common/NumberFormatTime';
import { Link } from 'react-router-dom';
import EventDeleteModal from './EventDeleteModal';

const useStyles = makeStyles(theme => ({
  modal: {
    maxWidth: '700px',
  },
  modalTitle: {
    textAlign: 'left',
    padding: '20px 20px',
  },
  toContainer: {
    textAlign: 'center',
  },
  headerPart: {
    marginBottom: '20px',
  },
  icon: {
    color: '#707070',
  },
  closeIcon: {
    color: '#D9D9D9',
  },
  addReminder: {
    color: '#B7B7B7',
    fontSize: '0.9em',
    margin: '10px 0 10px 0',
    textTransform: 'uppercase',
    padding: 0,
    backgroundColor: '#fff',
    '&:hover': {
      background: '#fff',
    },
  },
  actions: {
    margin: '35px 0 20px 0',
  },
  linkStyles: {
    textDecoration: 'none',
  },
  multilineColor: {
    color: '#2F6EE2',
  },
  lastUpdated: {
    color: '#B0B1B2',
    fontWeight: 600,
  },
  deleteButton: {
    marginRight: theme.spacing(1.5),
  },
  fileChip: {
    '& img': {
      height: '70%',
    },
    '&:hover': {
      background: '#e8e8e8',
    },
    background: '#F6F6F7',
    border: '1px solid #DBDCDE',
    borderRadius: '5px',
  },
  dateRow: {
    display: 'flex',
    padding: '8px',
    width: '100%',
    justifyContent: 'space-between',
  },
  dateCol: {
    alignItems: 'flex-end',
    display: 'flex',
  },
  dateInput: {
    maxWidth: '120px',
  },
  timeInput: {
    '& input': {
      '&::webkit-inner-spin-button, &::-webkit-outer-spin-button': {
        webkitAppearance: 'none',
        margin: '0',
      },
      paddingRight: '0',
    },
    width: 120,
  },
  conflictError: {
    color: 'rgb(247, 65, 53)',
  },
  chipRoot: {
    background: '#ffffff',
  },
  iconButtonRoot: {
    padding: 0,
    marginBottom: theme.spacing(0.5),
  },
  switchRoot: {
    width: 48,
    height: 28,
    padding: 0,
    display: 'flex',
  },
  switchBase: {
    padding: 4,
    color: theme.palette.grey[500],
    '&$checked': {
      transform: 'translateX(12px)',
      color: theme.palette.common.white,
      '& + $track': {
        opacity: 1,
        backgroundColor: 'red',
      },
    },
  },
  paddingBottom: {
    paddingBottom: 4,
  },
  switchThumb: {
    width: 20,
    height: 20,
    boxShadow: 'none',
    backgroundColor: theme.palette.common.white,
  },
  switchTrack: {
    border: 'none',
    borderRadius: 30,
    opacity: 1,
    backgroundColor: theme.palette.divider,
  },
  switchChecked: {},
  titleModalConfirm: {
    textAlign: 'center',
    paddingBottom: '0px',
    paddingTop: '35px',
  },
  colorDelBtn: {
    color: red['A700'],
  },
  hoverDelBtn: {
    '&:hover': {
      background: blue[800],
      color: blue[50],
    },
  },
}));

type EventDetailsProps = {
  event?: Event;
  open: boolean;
  setOpen: (open: boolean) => void;
  onDialogClose?: () => void;
  refetchEvents?: () => void;
  message?: Maybe<Message>;
  onEventCreation?: (eventId: string, event: Event) => void;
  onCreateEventFromMessageItem?: (eventId: string, event: Event) => void;
  currentUser: User;
  onEventDelition?: () => void;
  messageId?: string;
  messageTitle?: string | null | undefined;
  isMessageDone?: boolean | null | undefined;
  isMessageDeleted?: boolean | null | undefined;
};

interface EventForm {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  notifications: NotificationItem[];
}

type NotificationItem = {
  userId: string;
  period: string;
  periodType: PeriodType;
};

type ActionType = 'userId' | 'periodType' | 'period';
type PeriodType = 'Minute' | 'Hour' | 'Day' | 'Week';

const periodTypes = ['Minute', 'Hour', 'Day', 'Week'];
const periodRate = {
  Minute: 1000 * 60,
  Hour: 1000 * 60 * 60,
  Day: 1000 * 60 * 60 * 24,
  Week: 1000 * 60 * 60 * 24 * 7,
};

export const createLink = (
  userEmail: string,
  messageId: string | null | undefined,
  isDone: boolean | null | undefined,
  isDeleted: boolean | null | undefined,
): string => {
  if (isDone) {
    return `/messages/done/${messageId}`;
  } else if (isDeleted) {
    return `/messages/deleted/${messageId}`;
  } else {
    return `/inbox/${userEmail}/${messageId}`;
  }
};

const messageFragment = gql`
  fragment MyMessage on Message {
    id
    event {
      id #id should be for correct render
    }
  }
`;

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
  const initialEventForm: any = {
    ...message?.eventPreview,
    ...message?.eventInfo,
    ...event,
    startDate: moment(
      event?.startTime || message?.eventInfo?.startTime || now,
    ).format('l'),
    startTime: moment(
      event?.startTime || message?.eventInfo?.startTime || now,
    ).format('HH:mm'),
    endTime: moment(
      event?.endTime || message?.eventInfo?.endTime || oneHourFuture,
    ).format('HH:mm'),
    endDate: moment(
      event?.endTime || message?.eventInfo?.startTime || nowDateEndDate,
    ).format('l'),
    notifications: notifications,
  };

  const reducer = (
    // TODO: Fix the types. In rush atm to demo this.
    state: any,
    { field, value }: { field: string; value?: string },
  ) => {
    if (field === 'reset') {
      return initialEventForm;
    }
    if (field.match(/notification*/)) {
      const [, index, action] = field.split(':');
      if (action === 'add') {
        return {
          ...state,
          notifications: [
            ...state.notifications,
            { userId: 'none', period: '1', periodType: 'Hour' },
          ],
        };
      } else if (action === 'remove') {
        return {
          ...state,
          notifications: state.notifications.filter(
            (el: NotificationItem, i: number) => i !== Number(index),
          ),
        };
      } else if (action === 'periodType') {
        const updatedArray: NotificationItem[] = [...state.notifications];
        updatedArray[Number(index)].periodType = value as PeriodType;

        return {
          ...state,
          notifications: updatedArray,
        };
      } else if (action === 'period') {
        const updatedArray: NotificationItem[] = [...state.notifications];
        if (typeof value === 'string') {
          updatedArray[Number(index)].period = value;
        }

        return {
          ...state,
          notifications: updatedArray,
        };
      } else if (action === 'userId') {
        const updatedArray: NotificationItem[] = [...state.notifications];
        if (typeof value === 'string') {
          updatedArray[Number(index)].userId = value;
        }

        return {
          ...state,
          notifications: updatedArray,
        };
      }
    }
    if (field === 'startTime') {
      if (value) {
        const timeDif = differenceInMinutes(
          new Date(event?.endTime || oneHourFuture),
          new Date(event?.startTime || now),
        );

        const parsedDate = parse(value, 'HH:mm', new Date());
        const endTime = addMinutes(parsedDate, timeDif);
        return {
          ...state,
          startTime: isValid(parsedDate)
            ? format(parsedDate, 'HH:mm')
            : state.startTime,
          endTime: isValid(parsedDate)
            ? format(endTime, 'HH:mm')
            : state.endTime,
        };
      }
      return { ...state, [field]: value };
    }
    if (field === 'startDate') {
      if (value) {
        const timeDif = differenceInDays(
          new Date(event?.endTime || oneHourFuture),
          new Date(event?.startTime || now),
        );

        const addDaysDate = addDays(new Date(value), timeDif);
        const endDate = format(addDaysDate, 'M/d/Y');
        return {
          ...state,
          startDate: value,
          endDate,
        };
      }
      return { ...state, [field]: value };
    }

    return { ...state, [field]: value };
  };
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
                      <DatePicker
                        autoOk
                        className={classes.dateInput}
                        disableToolbar
                        disablePast={event ? false : true}
                        variant="inline"
                        format="M/d/yyyy"
                        value={eventForm.startDate}
                        inputVariant="outlined"
                        onChange={handleStartDateChange}
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
                  <div
                    className={`${classes.dateCol} ${classes.paddingBottom}`}
                  >
                    To
                  </div>
                  <div className={classes.dateCol}>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                      <DatePicker
                        autoOk
                        className={classes.dateInput}
                        disablePast={event ? false : true}
                        disableToolbar
                        variant="inline"
                        format="M/d/yyyy"
                        value={eventForm.endDate}
                        inputVariant="outlined"
                        onChange={date => {
                          if (!date) return;
                          dispatch({
                            field: 'endDate',
                            value: moment(date).format('l'),
                          });
                        }}
                        TextFieldComponent={props => (
                          <TextField
                            {...props}
                            size="small"
                            variant="outlined"
                            label="End Date"
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
                  <div
                    className={`${classes.dateCol} ${classes.paddingBottom}`}
                  >
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
                {eventForm.notifications.map(
                  (notify: NotificationItem, index: number) => (
                    <>
                      <Grid item xs={4}>
                        <FormControl variant="outlined" size="small" fullWidth>
                          <Select
                            value={notify.userId}
                            onChange={e =>
                              dispatch({
                                field: `notification:${index}:userId`,
                                value: e.target.value as string,
                              })
                            }
                          >
                            <MenuItem value="none">
                              <em>None</em>
                            </MenuItem>
                            {sharingUsers.map(item => (
                              <MenuItem value={item.id} key={item.id}>
                                <em>{`${item.name} (Notification)`}</em>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={2}>
                        <TextFieldMaterial
                          fullWidth
                          value={notify.period}
                          type="number"
                          size="small"
                          variant="outlined"
                          onChange={e =>
                            dispatch({
                              field: `notification:${index}:period`,
                              value: e.target.value as string,
                            })
                          }
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <FormControl variant="outlined" size="small" fullWidth>
                          <Select
                            value={notify.periodType}
                            onChange={e =>
                              dispatch({
                                field: `notification:${index}:periodType`,
                                value: e.target.value as string,
                              })
                            }
                          >
                            {periodTypes.map(periodType => (
                              <MenuItem key={periodType} value={periodType}>
                                {`${periodType}${
                                  notify.period === '1' ? '' : 's'
                                } Before`}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={2}>
                        <IconButton
                          onClick={() => {
                            dispatch({
                              field: `notification:${index}:remove`,
                            });
                          }}
                        >
                          <CloseOutlinedIcon className={classes.closeIcon} />
                        </IconButton>
                      </Grid>
                    </>
                  ),
                )}
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
                        value={
                          files.map(attachment => attachment?.name || '') || []
                        }
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
