
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

type SortBy = 'alphabetical' | 'votes';

interface SidebarContainerProps {
  filters: Filters;
  filterOptions: FilterOptions;
  onFilterChange: (filterType: keyof Filters, value: string) => void;
  onFeaturedToggle: (checked: boolean) => void;
  onTagsChange: (tags: string[]) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  sortBy: SortBy;
  onSortChange: (sortBy: SortBy) => void;
}

export function SidebarContainer({
  filters,
  filterOptions,
  onFilterChange,
  onFeaturedToggle,
  onTagsChange,
  onClearFilters,
  hasActiveFilters,
  sortBy,
  onSortChange,
}: SidebarContainerProps) {
  const classes = useStyles();

  return (
    <Box className={classes.sidebarContainer}>
      <FilterSidebar
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={onFilterChange}
        onFeaturedToggle={onFeaturedToggle}
        onTagsChange={onTagsChange}
        onClearFilters={onClearFilters}
        hasActiveFilters={hasActiveFilters}
        sortBy={sortBy}
        onSortChange={onSortChange}
      />
      <UsefulLinks />
    </Box>
  );
}

