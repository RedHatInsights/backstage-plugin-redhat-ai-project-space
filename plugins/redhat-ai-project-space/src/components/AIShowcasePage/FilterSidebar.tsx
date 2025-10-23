import React from 'react';
import {
  Paper,
  FormControl,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Box,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Filters, FilterOptions } from './types';

const useStyles = makeStyles((theme) => ({
  filterSidebar: {
    padding: theme.spacing(2),
    position: 'sticky',
    top: theme.spacing(2),
  },
  filterSection: {
    marginBottom: theme.spacing(2),
    width: '100%',
  },
}));

interface FilterSidebarProps {
  filters: Filters;
  filterOptions: FilterOptions;
  onFilterChange: (filterType: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function FilterSidebar({
  filters,
  filterOptions,
  onFilterChange,
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
    <FormControl className={classes.filterSection} variant="outlined" size="small">
      <InputLabel>{label}</InputLabel>
      <Select
        value={filters[filterType]}
        onChange={(e) => onFilterChange(filterType, e.target.value as string)}
        label={label}
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
  );

  return (
    <Paper className={classes.filterSidebar}>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>
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

