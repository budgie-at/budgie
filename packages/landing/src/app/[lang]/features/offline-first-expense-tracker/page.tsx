/* eslint-disable max-lines-per-function */
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageCloudVsBudgieTable } from '../../../../feature/component/feature-page-cloud-vs-budgie-table/feature-page-cloud-vs-budgie-table';
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

import type { Metadata } from 'next';

const SLUG = 'offline-first-expense-tracker';

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

export default async function OfflineFirstExpenseTrackerFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Offline-First Expense Tracker</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Every transaction lives on your device. No cloud account, no sign-up — your finances stay in your pocket, even on a
                        plane or in a tunnel.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why offline-first matters for an expense tracker</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Most budgeting apps push every swipe and balance to a remote server. That makes them fragile when the internet
                        drops, and risky when those servers leak. Budgie inverts the model: an encrypted SQLite database lives on your
                        phone, and that&apos;s the whole story. There is no backend reading your statements.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        You can log an expense at 30,000 feet, walk through a Tube tunnel, or work a week off-grid — Budgie just keeps
                        working. When you are back online, optional bank sync fills in the gaps you missed; manual edits are never blocked.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Works in airplane mode, tunnels, and rural areas — every feature, every time</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>No sign-up, no email, no account — install and start logging</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>AES-256 encrypted SQLite database, key derived from your PIN</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>No backend means no breach surface — there is nothing to leak</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Optional bank sync uses your own API tokens — never a third-party aggregator</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        On first launch, Budgie creates an encrypted SQLite database in your app sandbox. Every transaction, category,
                        account, and tag becomes a row in that file. The optional bank sync fetches statements directly from your
                        bank&apos;s API to your device — never via a third-party data aggregator. AI category suggestions run on a
                        1.7B-parameter model loaded into memory on your phone.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Cloud apps vs. Budgie</Trans>
                </FeaturePageHeading>
                <FeaturePageCloudVsBudgieTable />
            </FeaturePageSection>

            <FeaturePageFaqSection>
                <FeaturePageFaqItem
                    question={<Trans>Does Budgie work without internet?</Trans>}
                    answer={
                        <Trans>
                            Yes, fully. Every core feature — logging expenses, viewing analytics, managing categories — runs entirely on
                            your device. Internet is only used when you opt in to bank sync, AI model downloads, or exchange-rate updates.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What happens if I lose my phone?</Trans>}
                    answer={
                        <Trans>
                            Without a backup file, your data is gone — that&apos;s the privacy trade-off. Budgie offers a one-tap encrypted
                            database backup you can save to iCloud Drive, Google Drive, or anywhere else. Restore on a new device with one
                            tap.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is bank sync still offline?</Trans>}
                    answer={
                        <Trans>
                            Bank sync requires internet to fetch new transactions, but everything else continues working offline. Once
                            synced, your bank data lives on-device alongside manual entries.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What&apos;s the catch with offline-first?</Trans>}
                    answer={
                        <Trans>
                            The trade-off is multi-device sync — there&apos;s no automatic sync via our servers because we don&apos;t have
                            any. Use a backup file copied through your own cloud storage if you need to move between devices.
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
