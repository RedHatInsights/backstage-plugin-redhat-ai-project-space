export interface Filters {
  category: string;
  usecase: string;
  status: string;
  domain: string;
  maturity: string;
  featured: boolean;
  tags: string[];
}

export interface FilterOptions {
  categories: string[];
  usecases: string[];
  statuses: string[];
  domains: string[];
  maturities: string[];
  tags: string[];
}

export interface UsefulLink {
  title: string;
  url: string;
}

