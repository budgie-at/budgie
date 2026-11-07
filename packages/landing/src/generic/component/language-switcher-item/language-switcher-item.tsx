import Link from 'next/link';

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

interface Props {
    readonly locale: string;
    readonly href: string;
    readonly isCurrent: boolean;
}

export const LanguageSwitcherItem = ({ locale, href, isCurrent }: Props) => {
    const name = LANGUAGE_NAMES[locale] ?? locale;
    const ariaCurrent = isCurrent ? 'page' : 'false';

    return (
        <li>
            <Link
                aria-current={ariaCurrent}
                className="block rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground aria-[current=page]:font-semibold"
                href={href}
                hrefLang={locale}
                lang={locale}
                prefetch={false}
            >
                {name}
            </Link>
        </li>
    );
};
