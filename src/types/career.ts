export type CareerStatus = 'draft' | 'published' | 'archived';

export interface CareerFact { label: string; value: string }
export interface CareerClassifier { id: string; name: string }

export interface CareerOrganization {
  id: string;
  status: CareerStatus;
  name: string;
  shortName?: string;
  kind: string;
  description?: string;
  website?: string;
  location?: string;
  foundedYear?: number;
  logo?: string;
  cover?: string;
  industry?: CareerClassifier;
  facts?: CareerFact[];
  order?: number;
}

export interface CareerTransition {
  engagementId: string;
  type: 'promotion' | 'lateral' | 'expanded-scope' | 'contract-change' | 'return' | 'reorganization' | 'other';
  date: string;
  title: string;
  description?: string;
}

export interface CareerEngagement {
  id: string;
  status: CareerStatus;
  organizationId: string;
  title: string;
  employmentType: string;
  workMode?: string;
  startDate: string;
  endDate: string | null;
  datePrecision: 'day' | 'month' | 'year';
  location?: string;
  summary: string;
  responsibilities?: string[];
  activities?: string[];
  achievements?: string[];
  keyFacts?: CareerFact[];
  transitionFrom?: CareerTransition;
  technologies?: string[];
  skills?: string[];
  accentColor?: string;
  featured?: boolean;
  order?: number;
}

export interface CareerProjectAssignment {
  id: string;
  status: CareerStatus;
  engagementId: string;
  projectId: string;
  startDate?: string;
  endDate?: string | null;
  datePrecision?: 'day' | 'month' | 'year';
  role?: string;
  contribution?: string;
  participationTypes?: string[];
  highlights?: string[];
  featured?: boolean;
  order?: number;
}

export interface CareerResume {
  pdf?: { enabled: boolean; path: string; fileName: string; label?: string; updatedAt?: string };
  hh?: { enabled: boolean; url: string; label?: string };
}

export interface Career {
  schemaVersion: 1;
  status: CareerStatus;
  updatedAt: string;
  headline: string;
  summary: string;
  settings: {
    defaultView: 'timeline' | 'organizations';
    showParallelWork: boolean;
    showExperienceSummary: boolean;
    experienceStartDate?: string;
  };
  resume?: CareerResume;
  organizations: CareerOrganization[];
  engagements: CareerEngagement[];
  projectAssignments: CareerProjectAssignment[];
}
