/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBreadcrumbsJsonLd } from '../../../../feature/component/feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
import { FeaturePageCategoryComparison } from '../../../../feature/component/feature-page-category-comparison/feature-page-category-comparison';
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

export default async function PrivateBudgetAppAlternativePage(props: PageLangParam) {
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
                heading={<Trans>Private Budget App — A Cloud-Free Alternative</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Cloud-based personal finance apps mirror every transaction to their servers. Budgie keeps your ledger on your
                        device. No account, no aggregator, no exposure.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why this matters</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Cloud-based personal finance apps mirror every transaction to their servers. Budgie keeps your ledger on your
                        device. No account, no aggregator, no exposure.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Budgie vs. the category</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>
                            Cloud-based PFM apps mirror your transactions to their servers, share data with aggregators, and store your bank
                            credentials. Budgie does none of this — your data stays on your device, encrypted.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>
                            Budgie uses direct bank APIs (Monobank) and PDF/Excel statement imports (Erste, PrivatBank, anything CSV). No
                            third-party touches your data.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>
                            You backup to your own iCloud Drive, Google Drive, or Dropbox. Budgie never sees your data — your cloud, your
                            keys.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Yes — Budgie&apos;s source is public. Read the network code yourself: github.com/budgie-at/budgie.</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Feature comparison</Trans>
                </FeaturePageHeading>
                <FeaturePageCategoryComparison categoryLabel={<Trans>Cloud-based PFM apps</Trans>}>
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Encrypted on your device</Trans>}
                        competitorValue={<Trans>Vendor&apos;s cloud + aggregator</Trans>}
                        label={<Trans>Where transactions live</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>No</Trans>}
                        competitorValue={<Trans>Yes — email + password</Trans>}
                        label={<Trans>Account required</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Optional, direct API tokens</Trans>}
                        competitorValue={<Trans>Required, via aggregator</Trans>}
                        label={<Trans>Bank login</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Free for core, optional one-time unlock</Trans>}
                        competitorValue={<Trans>Monthly recurring</Trans>}
                        label={<Trans>Subscription</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>On your phone</Trans>}
                        competitorValue={<Trans>In the vendor cloud</Trans>}
                        label={<Trans>AI runs</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Yes</Trans>}
                        competitorValue={<Trans>No</Trans>}
                        label={<Trans>Public source</Trans>}
                    />
                </FeaturePageCategoryComparison>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>How is Budgie different from cloud-based PFM apps?</Trans>}
                    answer={
                        <Trans>
                            Cloud-based PFM apps mirror your transactions to their servers, share data with aggregators, and store your bank
                            credentials. Budgie does none of this — your data stays on your device, encrypted.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How does bank sync work without an aggregator?</Trans>}
                    answer={
                        <Trans>
                            Budgie uses direct bank APIs (Monobank) and PDF/Excel statement imports (Erste, PrivatBank, anything CSV). No
                            third-party touches your data.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What about multi-device sync?</Trans>}
                    answer={
                        <Trans>
                            You backup to your own iCloud Drive, Google Drive, or Dropbox. Budgie never sees your data — your cloud, your
                            keys.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is the privacy claim verifiable?</Trans>}
                    answer={
                        <Trans>Yes — Budgie&apos;s source is public. Read the network code yourself: github.com/budgie-at/budgie.</Trans>
                    }
                />
            </FeaturePageFaqSection>

            <FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
