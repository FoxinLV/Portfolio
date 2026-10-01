import { STORAGE_CONFIG } from '../config/environment';
import { objectUrl } from '../utils/storageUrl';

export class StorageError extends Error {}

async function checkedFetch(url: string) {
  const response = await fetch(url, { headers: { Accept: 'application/json, application/xml, text/xml' } });
  if (!response.ok) throw new StorageError(`Ошибка хранилища: HTTP ${response.status}`);
  return response;
}

export async function getJson<T>(path: string): Promise<T> {
  if (!STORAGE_CONFIG.configured) throw new StorageError('Адрес Object Storage не настроен');
  return (await checkedFetch(objectUrl(path))).json() as Promise<T>;
}

export async function listObjects(prefix: string): Promise<string[]> {
  if (!STORAGE_CONFIG.configured) throw new StorageError('Адрес Object Storage не настроен');
  const keys: string[] = [];
  let continuationToken = '';
  do {
    const params = new URLSearchParams({ 'list-type': '2', prefix });
    if (continuationToken) params.set('continuation-token', continuationToken);
    const xml = await (await checkedFetch(`${STORAGE_CONFIG.baseUrl}?${params}`)).text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror')) throw new StorageError('Хранилище вернуло некорректный XML');
    keys.push(...[...doc.querySelectorAll('Contents > Key')].map((node) => node.textContent ?? '').filter(Boolean));
    continuationToken = doc.querySelector('IsTruncated')?.textContent === 'true'
      ? doc.querySelector('NextContinuationToken')?.textContent ?? '' : '';
  } while (continuationToken);
  return keys;
}
