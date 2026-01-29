
import {
  Box,
  TextField,
  Chip,
  Typography,
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  filterSection: {
    marginBottom: theme.spacing(2),
    width: '100%',
  },
  filterLabel: {
    marginBottom: theme.spacing(0.5),
    fontWeight: 500,
  },
  chip: {
    margin: theme.spacing(0.25),
  },
}));

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagFilter({
  availableTags,
  selectedTags,
  onTagsChange,
}: TagFilterProps) {
  const classes = useStyles();

  return (
    <Box className={classes.filterSection}>
      <Typography variant="body2" className={classes.filterLabel}>
        Tags
      </Typography>
      <Autocomplete
        multiple
        id="tags-autocomplete"
        options={availableTags}
        value={selectedTags}
        onChange={(_, newValue) => {
          onTagsChange(newValue);
        }}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              label={option}
              size="small"
              className={classes.chip}
              {...getTagProps({ index })}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            size="small"
            placeholder={selectedTags.length === 0 ? "Type to search tags..." : ""}
          />
        )}
        filterSelectedOptions
        clearOnBlur
        selectOnFocus
        handleHomeEndKeys
      />
    </Box>
  );
}

