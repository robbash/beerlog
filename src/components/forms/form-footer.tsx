import { getTranslations } from 'next-intl/server';

export async function FormFooter() {
  const t = await getTranslations('formFooter');

  return (
    <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
      {t.rich('hint', {
        link: (chunks) => (
          <a href="https://www.mybeerlog.net/privacy/" target="_blank">
            {chunks}
          </a>
        ),
      })}
    </div>
  );
}
