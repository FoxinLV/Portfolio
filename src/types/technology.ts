export interface TechnologyCategory {
  id: string;
  name: string;
  order: number;
}

export interface TechnologyCatalogItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  order: number;
}

export interface TechnologyCatalog {
  schemaVersion: number;
  categories: TechnologyCategory[];
  technologies: TechnologyCatalogItem[];
}
