import React, { useEffect, useState, useMemo } from 'react';
import { Page, Header, Content, Progress } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { Grid } from '@material-ui/core';
import { Filters, FilterOptions } from './types';
import { getAnnotation, searchFunction } from './utils';
import { FilterSidebar } from './FilterSidebar';
import { UsefulLinks } from './UsefulLinks';
import { ProjectsTable } from './ProjectsTable';
import { SearchBar } from './SearchBar';

export function AIShowcasePage() {
  const catalogApi = useApi(catalogApiRef);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Filters>({
    category: '',
    usecase: '',
    status: '',
    domain: '',
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

    entities.forEach(entity => {
      const category = getAnnotation(entity, 'category');
      const usecase = getAnnotation(entity, 'usecase');
      const status = getAnnotation(entity, 'status');
      const domain = getAnnotation(entity, 'domain');

      if (category !== '-') categories.add(category);
      if (usecase !== '-') usecases.add(usecase);
      if (status !== '-') statuses.add(status);
      if (domain !== '-') domains.add(domain);
    });

    return {
      categories: Array.from(categories).sort(),
      usecases: Array.from(usecases).sort(),
      statuses: Array.from(statuses).sort(),
      domains: Array.from(domains).sort(),
    };
  }, [entities]);

  // Filter entities based on selected filters and search term
  const filteredEntities = useMemo(() => {
    return entities.filter(entity => {
      // Apply dropdown filters
      if (filters.category) {
        const category = getAnnotation(entity, 'category');
        if (category !== filters.category) return false;
      }
      if (filters.usecase) {
        const usecase = getAnnotation(entity, 'usecase');
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

  const clearFilters = () => {
    setFilters({
      category: '',
      usecase: '',
      status: '',
      domain: '',
    });
  };

  const hasActiveFilters = !!(filters.category || filters.usecase || filters.status || filters.domain);

  return (
    <Page themeId="tool">
      <Header title="AI Projects" subtitle="Red Hat AI Projects" />
      <Content>
        {loading && <Progress />}
        {error && <div>Error: {error}</div>}
        {!loading && !error && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <FilterSidebar
                filters={filters}
                filterOptions={filterOptions}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
              <UsefulLinks />
            </Grid>
            <Grid item xs={12} md={9}>
              <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
              <ProjectsTable entities={filteredEntities} />
            </Grid>
          </Grid>
        )}
      </Content>
    </Page>
  );
}
