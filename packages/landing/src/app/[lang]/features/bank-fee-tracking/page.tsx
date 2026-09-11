/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBreadcrumbsJsonLd } from '../../../../feature/component/feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
import { FeaturePageCta } from '../../../../feature/component/feature-page-cta/feature-page-cta';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageWebPageJsonLd } from '../../../../feature/component/feature-page-web-page-json-ld/feature-page-web-page-json-ld';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { BankFeeTrackingBenefitsSection } from './bank-fee-tracking-benefits-section/bank-fee-tracking-benefits-section';
import { BankFeeTrackingFaqSection } from './bank-fee-tracking-faq-section/bank-fee-tracking-faq-section';
import { BankFeeTrackingOverviewSection } from './bank-fee-tracking-overview-section/bank-fee-tracking-overview-section';
import { FEATURE_METADATA } from './metadata';

import type { Metadata } from 'next';

export const generateMetadata = async (props: PageLangParam): Promise<Metadata> => {
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
};

export default async function BankFeeTrackingFeaturePage(props: PageLangParam) {
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
                heading={featureName}
                locale={lang}
                tagline={
                    <Trans>
                        Keep ATM fees, transfer fees, and card commissions visible in analytics without turning every transfer into an
                        expense.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>A transfer can carry a cost</Trans>}>
                    <Trans>
                        Banks charge for moving your own money. Budgie keeps that charge attached to the transfer instead of inventing a
                        second expense.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>A fee is not a transfer</Trans>}>
                    <Trans>
                        Open the transfer and add a fee. It is filed under Bank Fees &amp; Charges and saved alongside the transfer, so the
                        $900 you moved stays $900.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Edit Transfer screen for a $900 transfer from Main Checking to Emergency Savings with a Bank Fees & Charges fee sheet showing $4.50 and a Save fee button`}
                    index={0}
                    locale={lang}
                    priority
                    scene="bank-fee-tracking-1"
                    slug="bank-fee-tracking"
                >
                    <FeatureStory.Callout y={0.812}>
                        <Trans>Attached to the transfer</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.876}>
                        <Trans>Saved with the fee</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>The transfer stays a transfer</Trans>}>
                    <Trans>
                        Analytics counts only the fee as spending and leaves the movement out, so shuffling $900 between your own accounts
                        never inflates your expenses.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie analytics spending-by-category list with Housing & Utilities first and Bank Fees & Charges second at $565.75`}
                    index={1}
                    locale={lang}
                    scene="bank-fee-tracking-2"
                    slug="bank-fee-tracking"
                >
                    <FeatureStory.Callout y={0.627}>
                        <Trans>Only fees are spending</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.765}>
                        <Trans>Counted as spending</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <BankFeeTrackingOverviewSection />
            <BankFeeTrackingBenefitsSection />
            <BankFeeTrackingFaqSection locale={lang} />

            <FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
