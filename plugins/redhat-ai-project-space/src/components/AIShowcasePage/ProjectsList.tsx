import React from 'react';
import { Entity } from '@backstage/catalog-model';
import { Button, Box, Typography, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import { ProjectCard } from './ProjectCard';

const useStyles = makeStyles((theme) => ({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 500,
  },
  addProjectButton: {
    textTransform: 'none',
  },
  emptyState: {
    padding: theme.spacing(4),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));

interface ProjectsListProps {
  entities: Entity[];
}

export function ProjectsList({ entities }: ProjectsListProps) {
  const classes = useStyles();

  return (
    <>
      <Box className={classes.header}>
        <Typography className={classes.title}>
          AI Projects ({entities.length})
        </Typography>
        <Button
          variant="contained"
          color="primary"
          className={classes.addProjectButton}
          startIcon={<AddIcon />}
          href="/create/templates/ai/add-new-ai-project"
        >
          Add New Project
        </Button>
      </Box>
      {entities.length === 0 ? (
        <Paper className={classes.emptyState}>
          <Typography variant="h6">No projects found</Typography>
          <Typography variant="body2">
            Try adjusting your filters or search terms
          </Typography>
        </Paper>
      ) : (
        entities.map(entity => (
          <ProjectCard
            key={`${entity.metadata.namespace}/${entity.kind}/${entity.metadata.name}`}
            entity={entity}
          />
        ))
      )}
    </>
  );
}

