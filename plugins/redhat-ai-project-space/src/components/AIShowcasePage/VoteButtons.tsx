import React, { useState, useEffect } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { projectVotesApiRef, VoteRatio } from '../../api/ProjectVotesApi';
import {
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 1),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
  },
  iconButton: {
    padding: theme.spacing(0.5),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  upvoteButton: {
    color: theme.palette.success.main,
  },
  upvoteButtonActive: {
    color: theme.palette.success.main,
    backgroundColor: theme.palette.action.selected,
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  },
  downvoteButton: {
    color: theme.palette.error.main,
  },
  downvoteButtonActive: {
    color: theme.palette.error.main,
    backgroundColor: theme.palette.action.selected,
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  },
  count: {
    fontSize: '0.875rem',
    fontWeight: 500,
    minWidth: '20px',
    textAlign: 'center',
  },
  ratio: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing(0.5),
  },
  divider: {
    color: theme.palette.divider,
    margin: theme.spacing(0, 0.5),
  },
  loading: {
    padding: theme.spacing(0.5),
  },
}));

interface VoteButtonsProps {
  projectId: string;
  initialVotes?: VoteRatio;
  onVoteChange?: (votes: VoteRatio) => void;
}

export const VoteButtons = ({ projectId, initialVotes, onVoteChange }: VoteButtonsProps) => {
  const classes = useStyles();
  const votesApi = useApi(projectVotesApiRef);
  const [votes, setVotes] = useState<VoteRatio | undefined>(initialVotes);
  const [loading, setLoading] = useState(false);

  // Update local state when initialVotes prop changes
  useEffect(() => {
    setVotes(initialVotes);
  }, [initialVotes]);

  const updateVotes = (newVotes: VoteRatio) => {
    setVotes(newVotes);
    if (onVoteChange) {
      onVoteChange(newVotes);
    }
  };

  const handleUpvote = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (loading) return;
    
    try {
      setLoading(true);
      const newVotes = await votesApi.upvote(projectId);
      updateVotes(newVotes);
    } catch (err) {
      console.error('Error upvoting:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownvote = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (loading) return;
    
    try {
      setLoading(true);
      const newVotes = await votesApi.downvote(projectId);
      updateVotes(newVotes);
    } catch (err) {
      console.error('Error downvoting:', err);
    } finally {
      setLoading(false);
    }
  };

  const upvotes = votes?.upvotes || 0;
  const downvotes = votes?.downvotes || 0;
  const ratio = votes?.ratio || 0;
  const percentage = Math.round(ratio * 100);
  const userVote = votes?.userVote;

  const upvoteButtonClass = userVote === 'upvote' 
    ? `${classes.iconButton} ${classes.upvoteButtonActive}`
    : `${classes.iconButton} ${classes.upvoteButton}`;

  const downvoteButtonClass = userVote === 'downvote'
    ? `${classes.iconButton} ${classes.downvoteButtonActive}`
    : `${classes.iconButton} ${classes.downvoteButton}`;

  return (
    <Box className={classes.container}>
      {loading ? (
        <CircularProgress size={20} className={classes.loading} />
      ) : (
        <>
          <Tooltip title={userVote === 'upvote' ? 'You upvoted this project' : 'Upvote this project'}>
            <IconButton
              size="small"
              onClick={handleUpvote}
              className={upvoteButtonClass}
              aria-label="upvote"
            >
              <ThumbUpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Typography className={classes.count}>
            {upvotes}
          </Typography>
          
          <Typography className={classes.divider}>
            |
          </Typography>
          
          <Typography className={classes.count}>
            {downvotes}
          </Typography>
          
          <Tooltip title={userVote === 'downvote' ? 'You downvoted this project' : 'Downvote this project'}>
            <IconButton
              size="small"
              onClick={handleDownvote}
              className={downvoteButtonClass}
              aria-label="downvote"
            >
              <ThumbDownIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {votes && votes.total > 0 && (
            <Typography className={classes.ratio}>
              ({percentage}%)
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

