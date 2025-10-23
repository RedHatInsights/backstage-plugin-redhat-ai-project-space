import React from 'react';
import { TableColumn, Link } from '@backstage/core-components';
import { Entity } from '@backstage/catalog-model';
import { Chip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { getAnnotation } from './utils';

const useStyles = makeStyles((theme) => ({
  nameCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  tagChip: {
    margin: theme.spacing(0.5),
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
  },
}));

export const useTableColumns = (): TableColumn<Entity>[] => {
  const classes = useStyles();

  return [
    {
      title: 'Name',
      field: 'metadata.title',
      render: (entity: Entity) => (
        <div className={classes.nameCell}>
          <Link
            to={`/catalog/${entity.metadata.namespace}/${entity.kind.toLowerCase()}/${
              entity.metadata.name
            }`}
          >
            {entity.metadata.title || entity.metadata.name}
          </Link>
          {entity.metadata.tags && entity.metadata.tags.length > 0 && (
            <div className={classes.chipContainer}>
              {entity.metadata.tags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  className={classes.tagChip}
                />
              ))}
            </div>
          )}
        </div>
      ),
      customSort: (a: Entity, b: Entity) =>
        (a.metadata.title || a.metadata.name || '').localeCompare(b.metadata.title || b.metadata.name || ''),
    },
    {
      title: 'Category',
      field: 'metadata.annotations.ai.redhat.com/category',
      render: (entity: Entity) => getAnnotation(entity, 'category'),
      customSort: (a: Entity, b: Entity) =>
        getAnnotation(a, 'category').localeCompare(getAnnotation(b, 'category')),
    },
    {
      title: 'Usecase',
      field: 'metadata.annotations.ai.redhat.com/usecase',
      render: (entity: Entity) => getAnnotation(entity, 'usecase'),
      customSort: (a: Entity, b: Entity) =>
        getAnnotation(a, 'usecase').localeCompare(getAnnotation(b, 'usecase')),
    },
    {
      title: 'Status',
      field: 'metadata.annotations.ai.redhat.com/status',
      render: (entity: Entity) => {
        const status = getAnnotation(entity, 'status');
        return (
          <Chip
            label={status}
            size="small"
            color={status === 'active' ? 'primary' : 'default'}
          />
        );
      },
      customSort: (a: Entity, b: Entity) =>
        getAnnotation(a, 'status').localeCompare(getAnnotation(b, 'status')),
    },
    {
      title: 'Owner',
      field: 'metadata.annotations.ai.redhat.com/owner',
      render: (entity: Entity) => {
        const owner = getAnnotation(entity, 'owner');
        const domain = getAnnotation(entity, 'domain');
        return (
          <div className={classes.chipContainer}>
            <span>{owner}</span>
            {domain !== '-' && (
              <Chip label={domain} size="small" variant="outlined" />
            )}
          </div>
        );
      },
      customSort: (a: Entity, b: Entity) =>
        getAnnotation(a, 'owner').localeCompare(getAnnotation(b, 'owner')),
    },
  ];
};

