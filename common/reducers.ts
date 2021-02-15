import format from 'date-fns/format';
import isValid from 'date-fns/isValid';
import differenceInMinutes from 'date-fns/differenceInMinutes';
import addMinutes from 'date-fns/addMinutes';
import differenceInDays from 'date-fns/differenceInDays';
import addDays from 'date-fns/addDays';
import parse from 'date-fns/parse';
import moment from 'moment';

import {
  NotificationItem,
  PeriodType,
} from '../src/types/types';

export const reducer = (
    // TODO: Fix the types. In rush atm to demo this.
    state: any,
    { field, value }: { field: string; value?: string },
    initialEventForm: any,
    oneHourFuture: moment.Moment,
    now: moment.Moment,
    event?: Event,

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