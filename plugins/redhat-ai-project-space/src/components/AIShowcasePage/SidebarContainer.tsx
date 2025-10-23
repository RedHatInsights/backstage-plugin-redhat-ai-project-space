import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FilterSidebar } from './FilterSidebar';
import { UsefulLinks } from './UsefulLinks';
import { Filters, FilterOptions } from './types';

const useStyles = makeStyles(() => ({
  sidebarContainer: {
    // Just a simple container, everything scrolls naturally together
  },
}));

interface SidebarContainerProps {
  filters: Filters;
  filterOptions: FilterOptions;
  onFilterChange: (filterType: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function SidebarContainer({
  filters,
  filterOptions,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
}: SidebarContainerProps) {
  const classes = useStyles();

  return (
    <Box className={classes.sidebarContainer}>
      <FilterSidebar
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        hasActiveFilters={hasActiveFilters}
      />
      <UsefulLinks />
    </Box>
  );
}

