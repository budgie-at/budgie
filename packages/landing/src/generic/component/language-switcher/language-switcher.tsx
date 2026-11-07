'use client';

import { useLingui } from '@lingui/react/macro';
import { useParams, usePathname, useRouter } from 'next/navigation';

import { SUPPORTED_LOCALES as locales } from '../../../i18n/supported-locales.constant.mjs';

import type { ChangeEvent } from 'react';

const LANGUAGE_NAMES: Record<string, string> = {
    // oxlint-disable-next-line lingui/no-unlocalized-strings
    en: 'English',
    uk: 'Українська',
    // oxlint-disable-next-line lingui/no-unlocalized-strings
    fr: 'Français',
    // oxlint-disable-next-line lingui/no-unlocalized-strings
    de: 'Deutsch',
    // oxlint-disable-next-line lingui/no-unlocalized-strings
    es: 'Español'
};

export const LanguageSwitcher = () => {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams<{ lang: string }>();
    const { i18n, t } = useLingui();

    const currentLocale = params.lang || i18n.locale || locales[0] || 'en';

    const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>): void => {
        const segments = pathname.split('/');
        segments[1] = event.currentTarget.value;
        const newPath = segments.join('/');

        router.push(newPath);
    };

    return (
        <select
            aria-label={t`Switch language`}
            className="h-9 w-28 cursor-pointer rounded-full border border-input bg-background px-3 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onChange={handleLanguageChange}
            value={currentLocale}
        >
            {locales.map(locale => (
                <option key={locale} lang={locale} value={locale}>
                    {LANGUAGE_NAMES[locale] || locale}
                </option>
            ))}
        </select>
    );
};
