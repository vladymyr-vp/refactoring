import { Maybe, Message, User, File } from '../../graphql/generated';

export type EventDetailsProps = {
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

export interface EventForm {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  notifications: NotificationItem[];
}

export type NotificationItem = {
  userId: string;
  period: string;
  periodType: PeriodType;
};

export type ActionType = 'userId' | 'periodType' | 'period'; 
export type PeriodType = 'Minute' | 'Hour' | 'Day' | 'Week';

export type normaliseEventFormHelperProps = {
  eventForm: any, allDay: boolean, files: File[]
}