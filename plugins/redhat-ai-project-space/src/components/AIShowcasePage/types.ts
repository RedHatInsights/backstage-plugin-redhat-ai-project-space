export interface Filters {
  category: string;
  usecase: string;
  status: string;
  domain: string;
}

export interface FilterOptions {
  categories: string[];
  usecases: string[];
  statuses: string[];
  domains: string[];
}

export interface UsefulLink {
  title: string;
  url: string;
}

