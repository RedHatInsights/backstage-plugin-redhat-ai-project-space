import React from 'react';
import { Link } from '@backstage/core-components';
import { Entity } from '@backstage/catalog-model';
import { Card, CardContent, Grid, Chip, Typography, Box, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { getAnnotation } from './utils';

const useStyles = makeStyles((theme) => ({
  card: {
    marginBottom: theme.spacing(2),
    '&:hover': {
      boxShadow: theme.shadows[4],
    },
  },
  titleRow: {
    marginBottom: theme.spacing(1),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 500,
  },
  readmeButton: {
    textTransform: 'none',
    minWidth: 'auto',
  },
  description: {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
    lineHeight: 1.5,
  },
  metadataGrid: {
    borderTop: `1px solid ${theme.palette.divider}`,
    paddingTop: theme.spacing(2),
  },
  metadataItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  metadataLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metadataValue: {
    fontSize: '0.875rem',
  },
  ownerName: {
    fontSize: '0.875rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '150px',
  },
  tagChip: {
    margin: theme.spacing(0.25),
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  statusChipContainer: {
    display: 'inline-flex',
  },
  internalProjectChip: {
    backgroundColor: '#4caf50',
    color: '#fff',
    '&:hover': {
      backgroundColor: '#45a049',
    },
  },
  externalProjectChip: {
    backgroundColor: '#ff9800',
    color: '#fff',
    '&:hover': {
      backgroundColor: '#fb8c00',
    },
  },
}));

interface ProjectCardProps {
  entity: Entity;
}

export function ProjectCard({ entity }: ProjectCardProps) {
  const classes = useStyles();

  const category = getAnnotation(entity, 'category');
  const usecase = getAnnotation(entity, 'usecase');
  const status = getAnnotation(entity, 'status');
  const owner = getAnnotation(entity, 'owner');
  const domain = getAnnotation(entity, 'domain');

  return (
    <Card className={classes.card}>
      <CardContent>
        {/* Title Row */}
        <Box className={classes.titleRow}>
          <Link
            to={`/catalog/${entity.metadata.namespace}/${entity.kind.toLowerCase()}/${
              entity.metadata.name
            }`}
            className={classes.title}
          >
            {entity.metadata.title || entity.metadata.name}
          </Link>
          <Link
            to={`/catalog/${entity.metadata.namespace}/${entity.kind.toLowerCase()}/${
              entity.metadata.name
            }/readme`}
          >
            <Button
              variant="outlined"
              size="small"
              className={classes.readmeButton}
            >
              README
            </Button>
          </Link>
        </Box>

        {/* Description Row */}
        {entity.metadata.description && (
          <Typography className={classes.description}>
            {entity.metadata.description}
          </Typography>
        )}

        {/* Tags Row */}
        {entity.metadata.tags && entity.metadata.tags.length > 0 && (
          <Box className={classes.chipContainer}>
            {entity.metadata.tags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                className={classes.tagChip}
              />
            ))}
          </Box>
        )}

        {/* Metadata Grid Row */}
        <Grid container spacing={2} className={classes.metadataGrid}>
          <Grid item xs={12} sm={6} md={3}>
            <div className={classes.metadataItem}>
              <Typography className={classes.metadataLabel}>Category</Typography>
              <Typography className={classes.metadataValue}>{category}</Typography>
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <div className={classes.metadataItem}>
              <Typography className={classes.metadataLabel}>Usecase</Typography>
              <Typography className={classes.metadataValue}>{usecase}</Typography>
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <div className={classes.metadataItem}>
              <Typography className={classes.metadataLabel}>Status</Typography>
              <Box className={classes.statusChipContainer}>
                <Chip
                  label={status}
                  size="small"
                  color="default"
                />
              </Box>
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <div className={classes.metadataItem}>
              <Typography className={classes.metadataLabel}>Owner</Typography>
              <Box display="flex" alignItems="center">
                <Typography className={classes.ownerName} title={owner}>
                  {owner}
                </Typography>
                {domain !== '-' && (
                  <Chip
                    label={domain}
                    size="small"
                    className={
                      domain.toLowerCase() === 'internal'
                        ? classes.internalProjectChip
                        : domain.toLowerCase() === 'external'
                        ? classes.externalProjectChip
                        : undefined
                    }
                    style={{ marginLeft: 8 }}
                  />
                )}
              </Box>
            </div>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

