import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeaturesHubGrid } from '../../../feature/component/features-hub-grid/features-hub-grid';
import { buildFeaturesItemListJsonLd } from '../../../feature/util/build-features-item-list-json-ld.util';
import { BreadcrumbsJsonLd } from '../../../generic/component/breadcrumbs-json-ld/breadcrumbs-json-ld';
import { JsonLd } from '../../../generic/component/json-ld/json-ld';
import { buildPageMetadata } from '../../../generic/util/build-page-metadata.util';
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
    )`Every Budgie feature in one place: bank sync, on-device AI, voice entry, multi-currency, recurring detection, and PIN-protected backups — all 100% offline-first.`;

    return buildPageMetadata({ description, locale: lang, path: PATH, title });
}

export default async function FeaturesHubPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);
    initLingui(lang);

    const itemList = buildFeaturesItemListJsonLd(i18n, lang);

    return (
        <main className="flex-1">
            <BreadcrumbsJsonLd locale={lang} path={PATH}>
                <BreadcrumbsJsonLd.Item name={t(i18n)`Home`} path={`/${lang}`} />
                <BreadcrumbsJsonLd.Item name={t(i18n)`Features`} path={`/${lang}${PATH}`} />
            </BreadcrumbsJsonLd>
            <JsonLd data={itemList} />
            <section className="w-full pt-12 pb-8 md:pt-20 md:pb-12">
                <div className="container px-4 md:px-6 max-w-5xl">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                        <Trans>All Budgie Features</Trans>
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                        <Trans>
                            Every capability of the Budgie offline-first expense tracker — from bank sync to on-device AI categorization —
                            in one place.
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
