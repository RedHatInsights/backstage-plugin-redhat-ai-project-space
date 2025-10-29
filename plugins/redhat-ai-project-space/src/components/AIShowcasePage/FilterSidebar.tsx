import React from 'react';
import {
  Paper,
  FormControl,
  Typography,
  Select,
  MenuItem,
  Button,
  Box,
  FormControlLabel,
  Checkbox,
} from '@material-ui/core';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import { makeStyles } from '@material-ui/core/styles';
import { Filters, FilterOptions } from './types';
import { TagFilter } from './TagFilter';

const useStyles = makeStyles((theme) => ({
  filterSidebar: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
  filterSection: {
    marginBottom: theme.spacing(2),
    width: '100%',
  },
  filterLabel: {
    marginBottom: theme.spacing(0.5),
    fontWeight: 500,
  },
  starIconChecked: {
    color: '#FFD700',
  },
  starIconUnchecked: {
    color: theme.palette.action.disabled,
  },
  placeholderText: {
    color: theme.palette.text.disabled,
    fontStyle: 'normal',
  },
}));

interface FilterSidebarProps {
  filters: Filters;
  filterOptions: FilterOptions;
  onFilterChange: (filterType: keyof Filters, value: string) => void;
  onFeaturedToggle: (checked: boolean) => void;
  onTagsChange: (tags: string[]) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function FilterSidebar({
  filters,
  filterOptions,
  onFilterChange,
  onFeaturedToggle,
  onTagsChange,
  onClearFilters,
  hasActiveFilters,
}: FilterSidebarProps) {
  const classes = useStyles();

  const FilterSection = ({
    label,
    options,
    filterType,
  }: {
    label: string;
    options: string[];
    filterType: keyof Filters;
  }) => (
    <Box className={classes.filterSection}>
      <Typography variant="body2" className={classes.filterLabel}>
        {label}
      </Typography>
      <FormControl variant="outlined" size="small" fullWidth>
        <Select
          value={filters[filterType]}
          onChange={(e) => onFilterChange(filterType, e.target.value as string)}
          displayEmpty
          renderValue={(value) => {
            if (!value || value === '') {
              return <span className={classes.placeholderText}>Showing all</span>;
            }
            return <span>{value as string}</span>;
          }}
        >
          <MenuItem value="">
            <em>All</em>
          </MenuItem>
          {options.map(option => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );

  return (
    <Paper className={classes.filterSidebar}>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>
      <FormControlLabel
        control={
          <Checkbox
            checked={filters.featured}
            onChange={(e) => onFeaturedToggle(e.target.checked)}
            icon={<StarBorderIcon className={classes.starIconUnchecked} />}
            checkedIcon={<StarIcon className={classes.starIconChecked} />}
          />
        }
        label="Featured Projects Only"
      />
      <Box mb={2} />
      <FilterSection
        label="Category"
        options={filterOptions.categories}
        filterType="category"
      />
      <FilterSection
        label="Usecase"
        options={filterOptions.usecases}
        filterType="usecase"
      />
      <FilterSection
        label="Status"
        options={filterOptions.statuses}
        filterType="status"
      />
      <FilterSection
        label="Domain"
        options={filterOptions.domains}
        filterType="domain"
      />
      <TagFilter
        availableTags={filterOptions.tags}
        selectedTags={filters.tags}
        onTagsChange={onTagsChange}
      />
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
        >
          Clear Filters
        </Button>
      </Box>
    </Paper>
  );
}

