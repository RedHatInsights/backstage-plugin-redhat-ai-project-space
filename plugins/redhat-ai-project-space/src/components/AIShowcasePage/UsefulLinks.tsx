import React from 'react';
import { Paper, Typography, Divider, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { usefulLinks } from './utils';

const useStyles = makeStyles((theme) => ({
  linksSidebar: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
  linkButton: {
    width: '100%',
    marginBottom: theme.spacing(1),
    justifyContent: 'space-between',
    textAlign: 'left',
    textTransform: 'none',
    padding: theme.spacing(1.5),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  linkButtonText: {
    flex: 1,
    textAlign: 'left',
  },
}));

export function UsefulLinks() {
  const classes = useStyles();

  return (
    <Paper className={classes.linksSidebar}>
      <Typography variant="h6" gutterBottom>
        AI @ Red Hat
      </Typography>
      <Divider style={{ marginBottom: 16 }} />
      {usefulLinks.map((link) => (
        <Button
          key={link.url}
          className={classes.linkButton}
          variant="outlined"
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          endIcon={<OpenInNewIcon fontSize="small" />}
        >
          <span className={classes.linkButtonText}>{link.title}</span>
        </Button>
      ))}
    </Paper>
  );
}

