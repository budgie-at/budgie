/* eslint-disable max-lines-per-function */
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageComparisonTable } from '../../../../feature/component/feature-page-comparison-table/feature-page-comparison-table';
import { FeaturePageCta } from '../../../../feature/component/feature-page-cta/feature-page-cta';
import { FeaturePageFaqItem } from '../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { buildFeaturePageJsonLd } from '../../../../feature/util/build-feature-page-json-ld.util';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
import { getFeatureBySlug } from '../../../../feature/util/get-feature-by-slug.util';
import { getRelatedFeatures } from '../../../../feature/util/get-related-features.util';
import { JsonLd } from '../../../../generic/component/json-ld/json-ld';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import type { ComparisonRowInterface } from '../../../../feature/component/feature-page-comparison-table/feature-page-comparison-table';
import type { Metadata } from 'next';

const SLUG = 'monobank-sync';

const COMPARISON_ROWS: ComparisonRowInterface[] = [
    {
        concern: <Trans>Token control</Trans>,
        rival: <Trans>Plaid-managed credential vault</Trans>,
        budgie: <Trans>Your token, in your keystore</Trans>
    },
    {
        concern: <Trans>FX preserved</Trans>,
        rival: <Trans>Often dropped or recomputed</Trans>,
        budgie: <Trans>Original FX kept per leg</Trans>
    },
    {
        concern: <Trans>Counter-IBAN stored</Trans>,
        rival: <Trans>Rarely surfaced</Trans>,
        budgie: <Trans>Yes — enables transfer-pair detection</Trans>
    },
    {
        concern: <Trans>Aggregator middleman</Trans>,
        rival: <Trans>Plaid (or similar) sees every transaction</Trans>,
        budgie: <Trans>None — Budgie talks to Monobank directly</Trans>
    }
];

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);
    const entry = getFeatureBySlug(SLUG);
    if (!isDefined(entry)) {
        return {};
    }

    return buildFeaturePageMetadata({
        locale: lang,
        slug: SLUG,
        title: i18n._(entry.metaTitle),
        description: i18n._(entry.metaDescription),
        keywords: entry.seoKeywords.join(', '),
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt
    });
}

export default async function MonobankSyncFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);
    const entry = getFeatureBySlug(SLUG);
    if (!isDefined(entry)) {
        return null;
    }

    const related = getRelatedFeatures(SLUG);
    const [breadcrumbSchema, webPageSchema, faqSchema] = buildFeaturePageJsonLd({
        locale: lang,
        slug: SLUG,
        title: i18n._(entry.metaTitle),
        description: i18n._(entry.metaDescription),
        featureName: i18n._(entry.title),
        featuresLabel: i18n._(msg`Features`),
        homeLabel: i18n._(msg`Home`),
        faqs: entry.faqs.map(faq => ({ question: i18n._(faq.question), answer: i18n._(faq.answer) })),
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt
    });

    return (
        <main className="flex-1">
            <JsonLd data={breadcrumbSchema} />
            <JsonLd data={webPageSchema} />
            {isDefined(faqSchema) && <JsonLd data={faqSchema} />}
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={i18n._(entry.title)} locale={lang} />}
                heading={<Trans>Monobank Auto-Sync for the Privacy-Conscious</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Connect your Monobank account, pull a full transaction history straight to your device, and keep working offline. No
                        third-party aggregator in between.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why direct API matters more than convenience</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Monobank exposes a clean public API, so Budgie talks to it directly from your phone using your token — no Plaid, no
                        data broker. Every transaction lands in your local SQLite database the moment it arrives.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Cross-currency transactions carry their original FX rate. Counter-party IBANs are stored, which lets Budgie
                        auto-merge transfer pairs across two accounts you own. The optional re-sync window lets you re-pull just the last N
                        days when your data drifts — without nuking manual edits.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Direct Monobank Personal API — your token, your call</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Full historical sync on first connect, then incremental every 30 minutes</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Cross-currency transactions preserve original FX rate per leg</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Counter-IBAN stored, enabling smart transfer-pair consolidation</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Windowed re-sync to fix drift without losing manual edits</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Generate a personal API token from the Monobank app, paste it into Budgie, choose which Monobank accounts to import,
                        and select an initial sync window. A background task syncs every 30 minutes when you&apos;re online; you control the
                        cadence and can pause anytime.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Plaid-based apps vs. Budgie + Monobank</Trans>
                </FeaturePageHeading>
                <FeaturePageComparisonTable rivalLabel={<Trans>Plaid-based app</Trans>} rows={COMPARISON_ROWS} />
            </FeaturePageSection>

            <FeaturePageFaqSection>
                <FeaturePageFaqItem
                    question={<Trans>How is this different from Plaid-based apps?</Trans>}
                    answer={
                        <Trans>
                            Plaid sits between you and your bank, mirroring all your transactions to its servers. Budgie talks to
                            Monobank&apos;s API directly from your phone using your token. Monobank sees the request; nothing else.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Where does my Monobank token live?</Trans>}
                    answer={
                        <Trans>
                            In your platform&apos;s secure keystore (iOS Keychain / Android Keystore), never in plaintext or our servers (we
                            have none).
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I use multiple Monobank accounts?</Trans>}
                    answer={<Trans>Yes — one token grants access to all your Monobank accounts. Pick which to import per account.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>What if Monobank&apos;s API changes?</Trans>}
                    answer={
                        <Trans>
                            Budgie is open source. The Monobank integration lives in packages/bank-sync/src/monobank/ and the project&apos;s
                            release cadence keeps it current.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>

            <FeaturePageRelated features={related} locale={lang} />
            <FeaturePageRelatedArticles locale={lang} slugs={entry.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
