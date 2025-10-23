import React from 'react';
import { Table } from '@backstage/core-components';
import { Entity } from '@backstage/catalog-model';
import { Button, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import { useTableColumns } from './tableColumns';

const useStyles = makeStyles((theme) => ({
  headerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: theme.spacing(2),
  },
  addProjectButton: {
    textTransform: 'none',
  },
}));

interface ProjectsTableProps {
  entities: Entity[];
}

export function ProjectsTable({ entities }: ProjectsTableProps) {
  const classes = useStyles();
  const columns = useTableColumns();

  return (
    <>
      <Box className={classes.headerActions}>
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
      <Table
        title={`AI Projects (${entities.length})`}
        options={{
          search: false,
          paging: true,
          pageSize: 20,
          sorting: true,
        }}
        columns={columns}
        data={entities}
      />
    </>
  );
}

