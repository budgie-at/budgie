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

export default async function SelfHostedFinanceAppMobilePage(props: PageLangParam) {
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
                heading={<Trans>Self-Hosted Finance App on Mobile — Without Running a Server</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Self-hosting promises privacy but ships a server you have to babysit. Budgie gives you the same data ownership with
                        zero ops — your phone is the server.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why this matters</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Self-hosting promises privacy but ships a server you have to babysit. Budgie gives you the same data ownership with
                        zero ops — your phone is the server.
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
                            If you enjoy ops work, do that. Most people don&apos;t, and a forgotten server with stale TLS is worse than a
                            vendor&apos;s cloud. Budgie keeps the data ownership story without the ops cost.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>
                            Copy the encrypted backup file via your own iCloud Drive, Google Drive, or Dropbox. Restore on the second device
                            with one tap.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Export your data as CSV anytime. Budgie doesn&apos;t lock you in.</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>
                            Yes — the encrypted backup is just a file. Save it anywhere you control: NAS, S3, your own server, your own
                            cloud.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Feature comparison</Trans>
                </FeaturePageHeading>
                <FeaturePageCategoryComparison categoryLabel={<Trans>Server-based finance apps</Trans>}>
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Encrypted on your phone</Trans>}
                        competitorValue={<Trans>Your VPS / Docker host</Trans>}
                        label={<Trans>Where data lives</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>None</Trans>}
                        competitorValue={<Trans>Yes — updates, certs, backups</Trans>}
                        label={<Trans>Server to maintain</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Native iOS + Android</Trans>}
                        competitorValue={<Trans>Web wrapper or none</Trans>}
                        label={<Trans>Mobile experience</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>To your own iCloud / Google Drive</Trans>}
                        competitorValue={<Trans>Manual server snapshots</Trans>}
                        label={<Trans>Backup</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Backup file copied via your cloud</Trans>}
                        competitorValue={<Trans>Built-in via your server</Trans>}
                        label={<Trans>Multi-device sync</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Install + open</Trans>}
                        competitorValue={<Trans>Hours of ops</Trans>}
                        label={<Trans>Setup time</Trans>}
                    />
                </FeaturePageCategoryComparison>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Why not just self-host an existing finance app?</Trans>}
                    answer={
                        <Trans>
                            If you enjoy ops work, do that. Most people don&apos;t, and a forgotten server with stale TLS is worse than a
                            vendor&apos;s cloud. Budgie keeps the data ownership story without the ops cost.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How do I sync between phone and tablet?</Trans>}
                    answer={
                        <Trans>
                            Copy the encrypted backup file via your own iCloud Drive, Google Drive, or Dropbox. Restore on the second device
                            with one tap.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if I want to migrate to a real self-hosted app later?</Trans>}
                    answer={<Trans>Export your data as CSV anytime. Budgie doesn&apos;t lock you in.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I keep my data backed up to my own server?</Trans>}
                    answer={
                        <Trans>
                            Yes — the encrypted backup is just a file. Save it anywhere you control: NAS, S3, your own server, your own
                            cloud.
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
