import { STORAGE_CONFIG } from '../config/environment';

export const objectUrl = (path: string) =>
  `${STORAGE_CONFIG.baseUrl}/${path.split('/').map(encodeURIComponent).join('/')}`;

export const portfolioAssetUrl = (relativePath: string) =>
  objectUrl(`${STORAGE_CONFIG.portfolioPrefix}/${relativePath.replace(/^\/+/, '')}`);

export const projectAssetUrl = (projectPath: string, relativePath: string) =>
  objectUrl(`${projectPath}/${relativePath.replace(/^\/+/, '')}`);
