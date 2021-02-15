import React from 'react';
import { User } from '../../graphql/generated';
import {
  Grid,
  TextField as TextFieldMaterial,
  FormControl,
  Select,
  MenuItem,
  IconButton,
} from '@material-ui/core';
import { CloseOutlined as CloseOutlinedIcon } from '@material-ui/icons';
import { NotificationItem } from '../types/types';
import { periodTypes } from '../../common/periodTypes';
import useStyles from '../styles/styles';

interface EventFormNotificationsProps {
  sharingUsers: User[];
  eventForm: any;
  dispatch: React.Dispatch<{
    field: string;
    value?: string | undefined;
  }>;
}

const EventFormNotifications = ({
  eventForm,
  sharingUsers,
  dispatch,
}: EventFormNotificationsProps) => {
  const classes = useStyles();
  return (
    <>
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
    </>
  );
};

export default EventFormNotifications;
