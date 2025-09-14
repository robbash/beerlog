import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = (await requestLocale) || 'en';

  if (!['en', 'de'].includes(locale)) locale = 'en';

  return {
    timeZone: 'Europe/Berlin',
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    formats: {
      dateTime: {
        short: {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        },
      },
    },
  };
});
