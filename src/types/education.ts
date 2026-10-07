export type EducationStatus = 'draft' | 'published' | 'archived';

export interface EducationAttachment {
  name: string;
  path: string;
  type?: string;
  size?: number;
}

export interface EducationEntry {
  id: string;
  status: EducationStatus;
  level: string;
  institution: string;
  faculty: string;
  specialization: string;
  graduationYear: number;
  description?: string;
  image?: string;
  attachments: EducationAttachment[];
  featured?: boolean;
  order?: number;
}

export interface CourseEntry {
  id: string;
  status: EducationStatus;
  title: string;
  organization: string;
  specialization: string;
  completionYear: number;
  description?: string;
  credentialUrl?: string;
  image?: string;
  attachments: EducationAttachment[];
  featured?: boolean;
  order?: number;
}

export interface Education {
  schemaVersion: 1;
  status: EducationStatus;
  updatedAt: string;
  headline: string;
  summary: string;
  education: EducationEntry[];
  courses: CourseEntry[];
}
