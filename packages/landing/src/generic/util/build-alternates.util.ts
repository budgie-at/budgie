import { BASE_URL, LOCALES } from '../constant/seo.constant';

export const buildAlternates = (lang: string, path: string) => ({
    canonical: `${BASE_URL}/${lang}${path}`,
    languages: {
        ...Object.fromEntries(LOCALES.map(locale => [locale, `${BASE_URL}/${locale}${path}`])),
        'x-default': `${BASE_URL}/en${path}`
    }
});
