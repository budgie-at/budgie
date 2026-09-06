/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBreadcrumbsJsonLd } from '../../../../feature/component/feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
import { FeaturePageComparisonTable } from '../../../../feature/component/feature-page-comparison-table/feature-page-comparison-table';
import { FeaturePageCta } from '../../../../feature/component/feature-page-cta/feature-page-cta';
import { FeaturePageFaqItem } from '../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { FeaturePageWebPageJsonLd } from '../../../../feature/component/feature-page-web-page-json-ld/feature-page-web-page-json-ld';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildFeaturePageMetadata({
        locale: lang,
        slug: FEATURE_METADATA.slug,
        title: i18n._(FEATURE_METADATA.metaTitle),
        description: i18n._(FEATURE_METADATA.metaDescription),
        keywords: FEATURE_METADATA.seoKeywords.join(', '),
        publishedAt: FEATURE_METADATA.publishedAt,
        updatedAt: FEATURE_METADATA.updatedAt
    });
}

export default async function OfflineFirstExpenseTrackerFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const description = i18n._(FEATURE_METADATA.metaDescription);
    const featureName = i18n._(FEATURE_METADATA.title);
    const title = i18n._(FEATURE_METADATA.metaTitle);
    const homePath = `/${lang}`;
    const featuresPath = `/${lang}/features`;
    const featurePath = `/${lang}/features/${FEATURE_METADATA.slug}`;

    return (
        <main className="flex-1">
            <FeaturePageBreadcrumbsJsonLd locale={lang} slug={FEATURE_METADATA.slug}>
                <FeaturePageBreadcrumbsJsonLd.Item name={t(i18n)`Home`} path={homePath} />
                <FeaturePageBreadcrumbsJsonLd.Item name={t(i18n)`Features`} path={featuresPath} />
                <FeaturePageBreadcrumbsJsonLd.Item name={featureName} path={featurePath} />
            </FeaturePageBreadcrumbsJsonLd>
            <FeaturePageWebPageJsonLd
                description={description}
                featureName={featureName}
                locale={lang}
                publishedAt={FEATURE_METADATA.publishedAt}
                slug={FEATURE_METADATA.slug}
                title={title}
                updatedAt={FEATURE_METADATA.updatedAt}
            />
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Offline-First Expense Tracker</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Every transaction lives on your device. No cloud account, no sign-up — your finances stay in your pocket, even on a
                        plane or in a tunnel.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Turn the radio off, nothing changes</Trans>}>
                    <Trans>Three screens with nothing behind them — the list, the entry, and a Settings page with no account on it.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Airplane mode changes nothing</Trans>}>
                    <Trans>The full list renders with the radio off. No spinner, no retry.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie transaction list showing eighty-one transactions read straight from the on-device database`}
                    index={0}
                    locale={lang}
                    priority
                    scene="offline-first-expense-tracker-1"
                    slug="offline-first-expense-tracker"
                >
                    <FeatureStory.Callout y={0.205}>
                        <Trans>81 transactions, no request</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.45}>
                        <Trans>The whole list, no spinner</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Saving is instant</Trans>}>
                    <Trans>The row lands and the balance updates before a network app finishes its request.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie new expense screen with the amount keypad, account row and confirm button`}
                    index={1}
                    locale={lang}
                    scene="expense-tracking-1"
                    slug="expense-tracking"
                >
                    <FeatureStory.Callout y={0.307}>
                        <Trans>Amount first, no form</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.884}>
                        <Trans>Writes straight to the device</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Nothing to sign into</Trans>}>
                    <Trans>No account row anywhere in Settings — because there is no account.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie settings screen with security, language, currency and default account rows and no sign-in row`}
                    index={2}
                    locale={lang}
                    scene="offline-first-expense-tracker-2"
                    slug="offline-first-expense-tracker"
                >
                    <FeatureStory.Callout y={0.17}>
                        <Trans>No cloud sync, no tracking</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.3}>
                        <Trans>A PIN, not a login</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

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
                    <Trans>Cloud apps vs. Budgie</Trans>
                </FeaturePageHeading>
                <FeaturePageComparisonTable rivalLabel={<Trans>Cloud app</Trans>}>
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>Your device only</Trans>}
                        concern={<Trans>Data location</Trans>}
                        rival={<Trans>Vendor servers + Plaid</Trans>}
                    />
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>Yes, fully</Trans>}
                        concern={<Trans>Works offline</Trans>}
                        rival={<Trans>Read-only at best</Trans>}
                    />
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>No</Trans>}
                        concern={<Trans>Account required</Trans>}
                        rival={<Trans>Yes</Trans>}
                    />
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>None — no servers</Trans>}
                        concern={<Trans>Subpoena risk</Trans>}
                        rival={<Trans>Vendor can be compelled</Trans>}
                    />
                </FeaturePageComparisonTable>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
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

            <FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
