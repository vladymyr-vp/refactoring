import { makeStyles } from '@material-ui/core/styles';
import { red, blue } from '@material-ui/core/colors';

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

export default useStyles