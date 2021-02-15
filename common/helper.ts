import moment from 'moment';
import { Maybe, Message } from '../graphql/generated';

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