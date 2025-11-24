import React from 'react';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  alertContainer: {
    marginBottom: theme.spacing(3),
    display: 'flex',
    justifyContent: 'center',
  },
  alert: {
    maxWidth: '100%',
  },
}));

interface DisclaimerAlertProps {
  message?: string;
}

export function DisclaimerAlert({ message }: DisclaimerAlertProps) {
  const classes = useStyles();

  const defaultMessage =
    'Friendly reminder: These projects have not been reviewed for security or compliance. ' +
    'We encourage you to exercise caution and do your due diligence before installing. ' +
    'Happy exploring!';

  return (
    <div className={classes.alertContainer}>
      <Alert severity="info" className={classes.alert}>
        {message || defaultMessage}
      </Alert>
    </div>
  );
}
