import { STORAGE_CONFIG } from '../config/environment';
import type { Profile } from '../types/profile';
import { getJson } from './storage.service';

export async function loadProfile(): Promise<Profile> {
  const profile = await getJson<Profile>(STORAGE_CONFIG.profilePath);
  if (!profile || profile.schemaVersion !== 1 || !profile.name || !profile.position || !Array.isArray(profile.specializations) ||
      !Array.isArray(profile.technologies) || !profile.contacts) throw new Error('Некорректный profile.json');
  return profile;
}
