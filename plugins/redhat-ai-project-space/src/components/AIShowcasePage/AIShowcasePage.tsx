import { useEffect, useState, useMemo } from 'react';
import { Page, Header, Content, Progress } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { Grid } from '@material-ui/core';
import { Filters, FilterOptions } from './types';
import { getAnnotation, searchFunction, isFeatured } from './utils';
import { SidebarContainer } from './SidebarContainer';
import { ProjectsList } from './ProjectsList';
import { SearchBar } from './SearchBar';
import { DisclaimerAlert } from './DisclaimerAlert';
import FloatingChat from './FloatingChat';

type SortBy = 'alphabetical' | 'votes';

export function AIShowcasePage() {
  const catalogApi = useApi(catalogApiRef);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('alphabetical');
  const [filters, setFilters] = useState<Filters>({
    category: '',
    usecase: '',
    status: '',
    domain: '',
    featured: false,
    tags: [],
  });

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const response = await catalogApi.getEntities({
          filter: {
            'metadata.namespace': 'ai',
            'kind': 'Component',
          },
        });
        setEntities(response.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching entities');
        console.error('Error fetching entities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntities();
  }, [catalogApi]);

  // Extract unique values for filters
  const filterOptions = useMemo((): FilterOptions => {
    const categories = new Set<string>();
    const usecases = new Set<string>();
    const statuses = new Set<string>();
    const domains = new Set<string>();
    const tags = new Set<string>();

    entities.forEach(entity => {
      const category = getAnnotation(entity, 'category');
      const usecase = getAnnotation(entity, 'use-case');
      const status = getAnnotation(entity, 'status');
      const domain = getAnnotation(entity, 'domain');

      if (category !== '-') categories.add(category);
      if (usecase !== '-') usecases.add(usecase);
      if (status !== '-') statuses.add(status);
      if (domain !== '-') domains.add(domain);

      // Extract tags from entity metadata
      if (entity.metadata.tags) {
        entity.metadata.tags.forEach(tag => tags.add(tag));
      }
    });

    return {
      categories: Array.from(categories).sort(),
      usecases: Array.from(usecases).sort(),
      statuses: Array.from(statuses).sort(),
      domains: Array.from(domains).sort(),
      tags: Array.from(tags).sort(),
    };
  }, [entities]);

  // Filter entities based on selected filters and search term
  const filteredEntities = useMemo(() => {
    return entities.filter(entity => {
      // Apply featured filter
      if (filters.featured && !isFeatured(entity)) {
        return false;
      }
      
      // Apply dropdown filters
      if (filters.category) {
        const category = getAnnotation(entity, 'category');
        if (category !== filters.category) return false;
      }
      if (filters.usecase) {
        const usecase = getAnnotation(entity, 'use-case');
        if (usecase !== filters.usecase) return false;
      }
      if (filters.status) {
        const status = getAnnotation(entity, 'status');
        if (status !== filters.status) return false;
      }
      if (filters.domain) {
        const domain = getAnnotation(entity, 'domain');
        if (domain !== filters.domain) return false;
      }
      
      // Apply tag filter (additive - show entities with ANY of the selected tags)
      if (filters.tags.length > 0) {
        const entityTags = entity.metadata.tags || [];
        const hasMatchingTag = filters.tags.some(selectedTag => 
          entityTags.includes(selectedTag)
        );
        if (!hasMatchingTag) return false;
      }
      
      // Apply search filter
      if (searchTerm && !searchFunction(entity, searchTerm)) {
        return false;
      }
      
      return true;
    });
  }, [entities, filters, searchTerm]);

  const handleFilterChange = (filterType: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleFeaturedToggle = (checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      featured: checked,
    }));
  };

  const handleTagsChange = (tags: string[]) => {
    setFilters(prev => ({
      ...prev,
      tags,
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      usecase: '',
      status: '',
      domain: '',
      featured: false,
      tags: [],
    });
  };

  const hasActiveFilters = !!(filters.category || filters.usecase || filters.status || filters.domain || filters.featured || filters.tags.length > 0);

  return (
    <Page themeId="tool">
      <Header title="AI Projects" subtitle="Red Hat AI Projects" />
      <Content>
        {loading && <Progress />}
        {error && <div>Error: {error}</div>}
        {!loading && !error && (
          <>
            <DisclaimerAlert />
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <SidebarContainer
                  filters={filters}
                  filterOptions={filterOptions}
                  onFilterChange={handleFilterChange}
                  onFeaturedToggle={handleFeaturedToggle}
                  onTagsChange={handleTagsChange}
                  onClearFilters={clearFilters}
                  hasActiveFilters={hasActiveFilters}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
              </Grid>
              <Grid item xs={12} md={9}>
                <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                <ProjectsList entities={filteredEntities} sortBy={sortBy} />
              </Grid>
            </Grid>
          </>
        )}
      </Content>
      <FloatingChat />
    </Page>
  );
}
