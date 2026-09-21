import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SUPPORTED_LOCALES } from '../../i18n/supported-locales.constant.mjs';

const OG_PLATE_ROOT = join(process.cwd(), 'public', 'og-plate');
const FALLBACK_LOCALE = 'en';

export const resolveOgPlate = (slug: string, locale: string): string | undefined =>
    [locale, FALLBACK_LOCALE]
        .filter(candidateLocale => SUPPORTED_LOCALES.includes(candidateLocale))
        .map(candidateLocale => join(OG_PLATE_ROOT, slug, `${candidateLocale}.jpg`))
        .filter(candidatePath => existsSync(candidatePath))
        .slice(0, 1)
        .map(platePath => `data:image/jpeg;base64,${readFileSync(platePath).toString('base64')}`)
        .at(0);
