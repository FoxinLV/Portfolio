export interface Specialization { id: string; title: string; description: string }
export interface ProfileContacts { telegram?: string; github?: string; email?: string }
export interface TechnologyItem { name: string; icon?: string; url?: string }
export interface TechnologyGroup { category: string; items: (string | TechnologyItem)[] }
export interface Profile {
  schemaVersion: number;
  name: string;
  position: string;
  description: string;
  avatar?: string;
  about?: string;
  approach?: string;
  experience?: string[];
  specializations: Specialization[];
  technologies: string[] | TechnologyGroup[];
  contacts: ProfileContacts;
}
