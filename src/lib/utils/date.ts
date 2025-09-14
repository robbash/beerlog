import { getFormatter } from 'next-intl/server';

export async function formatDateTime(date: Date) {
  const format = await getFormatter();

  const formatted = format.dateTime(date, 'short');

  if (/\//.test(formatted)) {
    const parts = formatted.split('/');

    return `${parts[1]}.${parts[0]}.${parts[2]}`;
  }

  return formatted;
}
