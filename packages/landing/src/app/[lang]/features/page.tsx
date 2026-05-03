 
import { msg, t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeaturesHubGrid } from '../../../feature/component/features-hub-grid/features-hub-grid';
import { JsonLd } from '../../../generic/component/json-ld/json-ld';
import { BASE_URL } from '../../../generic/constant/seo.constant';
import { buildAlternates } from '../../../generic/util/build-alternates.util';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../i18n/init-lingui';

import type { Metadata } from 'next';

const PATH = '/features';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);
    const title = t(i18n)`All Budgie Features — Offline-First Expense Tracker`;
    const description = t(
        i18n
    )`Browse every Budgie feature: bank sync, on-device AI categorization, voice entry, multi-currency, recurring detection, encrypted backups, and more — all 100% offline-first.`;

    return {
        title,
        description,
        alternates: buildAlternates(lang, PATH),
        openGraph: {
            title,
            description,
            type: 'website',
            url: `${BASE_URL}/${lang}${PATH}`
        },
        twitter: { card: 'summary_large_image', title, description, site: '@budgie_at', creator: '@budgie_at' }
    };
}

export default async function FeaturesHubPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);
    initLingui(lang);

    /* eslint-disable lingui/no-unlocalized-strings */
    const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: i18n._(msg`Home`), item: `${BASE_URL}/${lang}` },
            { '@type': 'ListItem', position: 2, name: i18n._(msg`Features`), item: `${BASE_URL}/${lang}${PATH}` }
        ]
    };
    /* eslint-enable lingui/no-unlocalized-strings */

    return (
        <main className="flex-1">
            <JsonLd data={breadcrumb} />
            <section className="w-full pt-12 pb-8 md:pt-20 md:pb-12">
                <div className="container px-4 md:px-6 max-w-5xl">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                        <Trans>All Budgie Features</Trans>
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                        <Trans>
                            Every capability of the Budgie offline-first expense tracker — from bank sync to on-device AI
                            categorization — in one place.
                        </Trans>
                    </p>
                </div>
            </section>
            <section className="w-full pb-20">
                <div className="container px-4 md:px-6 max-w-5xl">
                    <FeaturesHubGrid locale={lang} />
                </div>
            </section>
        </main>
    );
}
