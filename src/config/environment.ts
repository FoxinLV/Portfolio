const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '');

const storageBaseUrl = (import.meta.env.VITE_STORAGE_BASE_URL || '').replace(/\/$/, '');
const portfolioPrefix = trimSlashes(import.meta.env.VITE_PORTFOLIO_PREFIX || 'portfolio');

export const STORAGE_CONFIG = {
  baseUrl: storageBaseUrl,
  portfolioPrefix,
  projectsPrefix: `${portfolioPrefix}/projects`,
  profilePath: `${portfolioPrefix}/profile.json`,
  careerPath: `${portfolioPrefix}/career/career.json`,
  educationPath: `${portfolioPrefix}/education/education.json`,
  configured: Boolean(storageBaseUrl) && !storageBaseUrl.includes('BUCKET_NAME')
};
