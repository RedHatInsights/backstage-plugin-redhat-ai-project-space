import { useMemo } from 'react';
import { Entity } from '@backstage/catalog-model';
import { Button, Box, Typography, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import HelpIcon from '@material-ui/icons/Help';
import FeedbackIcon from '@material-ui/icons/Feedback';
import { ProjectCard } from './ProjectCard';
import { useProjectVotes } from '../../hooks/useProjectVotes';

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
  buttonGroup: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  addProjectButton: {
    textTransform: 'none',
  },
  helpButton: {
    textTransform: 'none',
  },
  feedbackButton: {
    textTransform: 'none',
  },
  emptyState: {
    padding: theme.spacing(4),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));

type SortBy = 'alphabetical' | 'votes';

interface ProjectsListProps {
  entities: Entity[];
  sortBy: SortBy;
}

export function ProjectsList({ entities, sortBy }: ProjectsListProps) {
  const classes = useStyles();
  const { votes, refreshVote } = useProjectVotes();

  // Helper function to get project ID from entity
  const getProjectId = (entity: Entity) => {
    return `${entity.metadata.namespace}/${entity.kind.toLowerCase()}/${entity.metadata.name}`;
  };

  // Sort entities based on selected sort method
  const sortedEntities = useMemo(() => {
    const entitiesCopy = [...entities];
    
    if (sortBy === 'alphabetical') {
      return entitiesCopy.sort((a, b) => {
        const nameA = (a.metadata.title || a.metadata.name).toLowerCase();
        const nameB = (b.metadata.title || b.metadata.name).toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else {
      // Sort by votes (highest ratio first)
      return entitiesCopy.sort((a, b) => {
        const projectIdA = getProjectId(a);
        const projectIdB = getProjectId(b);
        const voteA = votes.get(projectIdA);
        const voteB = votes.get(projectIdB);
        
        // If neither has votes, maintain alphabetical order
        if (!voteA && !voteB) {
          const nameA = (a.metadata.title || a.metadata.name).toLowerCase();
          const nameB = (b.metadata.title || b.metadata.name).toLowerCase();
          return nameA.localeCompare(nameB);
        }
        
        // Projects with votes come before projects without votes
        if (!voteA) return 1;
        if (!voteB) return -1;
        
        // Sort by ratio (descending), then by total votes (descending)
        if (voteB.ratio !== voteA.ratio) {
          return voteB.ratio - voteA.ratio;
        }
        return voteB.total - voteA.total;
      });
    }
  }, [entities, sortBy, votes]);

  return (
    <>
      <Box className={classes.header}>
        <Typography className={classes.title}>
          AI Projects ({entities.length})
        </Typography>
        <Box className={classes.buttonGroup}>
          <Button
            variant="contained"
            color="primary"
            className={classes.helpButton}
            startIcon={<HelpIcon />}
            href="/docs/default/component/inscope-onboarding-guide/ai-projects"
            target="_blank"
            rel="noopener noreferrer"
          >
            Help
          </Button>
          <Button
            variant="contained"
            color="primary"
            className={classes.feedbackButton}
            startIcon={<FeedbackIcon />}
            href="https://issues.redhat.com/browse/RHCLOUD-43344"
            target="_blank"
            rel="noopener noreferrer"
          >
            Feedback
          </Button>
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
      </Box>
      {entities.length === 0 ? (
        <Paper className={classes.emptyState}>
          <Typography variant="h6">No projects found</Typography>
          <Typography variant="body2">
            Try adjusting your filters or search terms
          </Typography>
        </Paper>
      ) : (
        sortedEntities.map(entity => {
          const projectId = getProjectId(entity);
          const projectVotes = votes.get(projectId);
          
          return (
            <ProjectCard
              key={projectId}
              entity={entity}
              votes={projectVotes}
              onVoteChange={(newVotes) => refreshVote(newVotes.projectId)}
            />
          );
        })
      )}
    </>
  );
}

