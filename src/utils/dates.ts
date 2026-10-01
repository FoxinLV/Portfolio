const SHORT_MONTH = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', timeZone: 'UTC' });
const LONG_DATE = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const projectYear = (date: string) => new Date(`${date}T00:00:00Z`).getUTCFullYear();
export const shortDate = (date: string) => SHORT_MONTH.format(new Date(`${date}T00:00:00Z`)).replace('.', '');
export const longDate = (date: string) => LONG_DATE.format(new Date(`${date}T00:00:00Z`));
