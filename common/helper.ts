import moment from 'moment';
import { Maybe, Message, UpdateEventInput, EventNotificationInput, User } from '../graphql/generated';
import { NotificationItem, normaliseEventFormHelperProps, PeriodType } from '../src/types/types';
import { periodRate } from '../common/periodTypes';
import convertMStoTimeLeft from '../common/convertMSToTimeLeft';


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

export const initialEventForm = (message: Maybe<Message>, now: moment.Moment, oneHourFuture: moment.Moment, nowDateEndDate: moment.Moment, notifications: object[], event?: Event): any => ({
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
});

export const normaliseEventFormHelper = ({eventForm, allDay, files}:  normaliseEventFormHelperProps) => (): UpdateEventInput => {
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
  

export const handleAllDayHelper = (allDay,
  setAllDay,
  dispatch,
  allDayBufferStartTime,
  allDayBufferEndTime,
  eventForm,
  setAllDayBufferStartTime,
  setAllDayBufferEndTime) => () => {
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

export const eventDetailsUseEffectHelper = (sharedData,currentUser, event, notificationSettingsData, setNotifications, setSharingUsers ) => {
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