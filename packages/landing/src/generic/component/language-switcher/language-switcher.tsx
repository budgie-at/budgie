'use client';

import { Trans, useLingui } from '@lingui/react/macro';
import { Check, Languages } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';

import linguiConfig from '../../../../lingui.config.mjs';
import { Button } from '../../../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/dropdown-menu/dropdown-menu';

const LANGUAGE_NAMES: Record<string, string> = {
    // eslint-disable-next-line lingui/no-unlocalized-strings
    en: 'English',
    uk: 'Українська',
    // eslint-disable-next-line lingui/no-unlocalized-strings
    fr: 'Français',
    // eslint-disable-next-line lingui/no-unlocalized-strings
    de: 'Deutsch',
    // eslint-disable-next-line lingui/no-unlocalized-strings
    es: 'Español'
};

const { locales } = linguiConfig;

export const LanguageSwitcher = () => {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const { i18n } = useLingui();

    // Determine current locale: prioritize URL param, fallback to i18n state, then config default
    const currentLocale = (params.lang as string) || i18n.locale || locales[0] || 'en';

    const handleLanguageChange = (newLocale: string) => (): void => {
        // Replace the current locale in the pathname with the new one
        const segments = pathname.split('/');
        segments[1] = newLocale;
        const newPath = segments.join('/');

        router.push(newPath);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="rounded-full" size="icon" variant="ghost">
                    <Languages className="size-[18px]" />

                    <span className="sr-only">
                        <Trans>Switch language</Trans>
                    </span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                {locales.map(locale => (
                    <DropdownMenuItem key={locale} className="cursor-pointer" onClick={handleLanguageChange(locale)}>
                        <span className="flex-1">{LANGUAGE_NAMES[locale] || locale}</span>

                        {currentLocale === locale ? <Check className="size-4" /> : null}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
