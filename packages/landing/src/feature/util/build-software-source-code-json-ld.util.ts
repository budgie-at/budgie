/* oxlint-disable lingui/no-unlocalized-strings */
import { BASE_URL } from '../../generic/constant/seo.constant';

export const buildSoftwareSourceCodeJsonLd = (locale: string): Record<string, unknown> => ({
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: 'Budgie Source Code',
    codeRepository: 'https://github.com/budgie-at/budgie',
    license: `${BASE_URL}/${locale}/legal/license`,
    programmingLanguage: ['TypeScript', 'React Native']
});
