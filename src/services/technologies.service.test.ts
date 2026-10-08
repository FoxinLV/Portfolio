import { describe, expect, it } from 'vitest';
import catalog from '../../technology-catalog.s3.json';
import profileTechnologies from '../../profile-technologies.s3.json';
import { isValidTechnologyCatalog } from './technologies.service';

describe('technology catalog', () => {
  it('contains the complete categorized catalog for storage', () => {
    expect(isValidTechnologyCatalog(catalog)).toBe(true);
    expect(catalog.categories).toHaveLength(13);
    expect(catalog.technologies).toHaveLength(91);
    expect(new Set(catalog.technologies.map((item) => item.id)).size).toBe(91);
  });

  it('keeps the About page JSON synchronized with the catalog', () => {
    const profileItems = profileTechnologies.flatMap((group) => group.items);
    expect(profileItems).toHaveLength(catalog.technologies.length);
    expect(profileItems.map((item) => item.id)).toEqual(catalog.technologies.map((item) => item.id));
    expect(profileItems.map((item) => item.icon)).toEqual(catalog.technologies.map((item) => item.icon));
  });

  it('rejects technologies linked to a missing category', () => {
    expect(isValidTechnologyCatalog({
      schemaVersion: 1,
      categories: [{ id: 'frontend', name: 'Фронтенд', order: 10 }],
      technologies: [{ id: 'react', name: 'React', icon: 'icons/react.svg', category: 'missing', order: 10 }]
    })).toBe(false);
  });
});
