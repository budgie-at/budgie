'use client';

import { Trans } from '@lingui/react/macro';
import { useParams, usePathname } from 'next/navigation';
import { Language } from 'reicon-react';

import { SUPPORTED_LOCALES as locales } from '../../../i18n/supported-locales.constant.mjs';
import { LanguageSwitcherItem } from '../language-switcher-item/language-switcher-item';

export const LanguageSwitcher = () => {
    const pathname = usePathname();
    const { lang } = useParams<{ lang: string }>();
    const segments = pathname.split('/');

    return (
        <details key={pathname} className="relative">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                <Language className="size-[18px]" />

                <span className="sr-only">
                    <Trans>Switch language</Trans>
                </span>
            </summary>

            <ul className="absolute right-0 z-50 mt-2 min-w-36 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                {locales.map(locale => (
                    <LanguageSwitcherItem
                        key={locale}
                        href={[segments[0], locale, ...segments.slice(2)].join('/')}
                        isCurrent={locale === lang}
                        locale={locale}
                    />
                ))}
            </ul>
        </details>
    );
};
