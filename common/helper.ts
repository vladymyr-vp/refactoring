import moment from 'moment';
import { Maybe, Message, UpdateEventInput, EventNotificationInput } from '../graphql/generated';
import { NotificationItem, normaliseEventFormHelperProps } from '../src/types/types';
import { periodRate } from '../common/periodTypes';

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