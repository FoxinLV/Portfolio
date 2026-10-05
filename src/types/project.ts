export type ProjectStatus = 'draft' | 'published' | 'archived';

export interface ProjectClassifier { id: string; name: string }
export interface ProjectFile { name: string; path: string; description?: string; type?: string }
export interface ProjectLink { type: string; title: string; url: string }
export interface ProjectTechnology { name: string; icon?: string; url?: string }

export interface Project {
  schemaVersion: number;
  id: string;
  status: ProjectStatus;
  title: string;
  shortDescription: string;
  description?: string;
  date: string;
  type: ProjectClassifier;
  direction: ProjectClassifier;
  technologies: (string | ProjectTechnology)[];
  cover?: string;
  gallery?: string[];
  files?: ProjectFile[];
  links?: ProjectLink[];
  features?: string[];
  role?: string;
  tasks?: string[];
  results?: string[];
  storagePath: string;
}

export interface ProjectFilters {
  query: string;
  year: string;
  type: string;
  technology: string;
  direction: string;
}

export const EMPTY_FILTERS: ProjectFilters = {
  query: '', year: '', type: '', technology: '', direction: ''
};
