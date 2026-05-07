import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { JsonLd } from '../../../generic/component/json-ld/json-ld';
import { initLingui } from '../../../i18n/init-lingui';
import { buildFeaturePageJsonLd } from '../../util/build-feature-page-json-ld.util';
import { getFeatureBySlug } from '../../util/get-feature-by-slug.util';
import { getRelatedFeatures } from '../../util/get-related-features.util';
import { FeatureBreadcrumbs } from '../feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGrid } from '../feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBenefitGridItem } from '../feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageCategoryComparison } from '../feature-page-category-comparison/feature-page-category-comparison';
import { FeaturePageCta } from '../feature-page-cta/feature-page-cta';
import { FeaturePageFaqItem } from '../feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../feature-page-heading/feature-page-heading';
import { FeaturePageHero } from '../feature-page-hero/feature-page-hero';
import { FeaturePageProse } from '../feature-page-prose/feature-page-prose';
import { FeaturePageRelated } from '../feature-page-related/feature-page-related';
import { FeaturePageRelatedArticles } from '../feature-page-related-articles/feature-page-related-articles';
import { FeaturePageSection } from '../feature-page-section/feature-page-section';

interface Props {
    readonly locale: string;
    readonly slug: string;
}

export const FeaturePageComparisonShell = ({ locale, slug }: Props) => {
    const i18n = initLingui(locale);
    const entry = getFeatureBySlug(slug);
    if (!isDefined(entry)) {
        return null;
    }

    const related = getRelatedFeatures(slug);
    const [breadcrumbSchema, webPageSchema, faqSchema] = buildFeaturePageJsonLd({
        locale,
        slug,
        title: i18n._(entry.metaTitle),
        description: i18n._(entry.metaDescription),
        featureName: i18n._(entry.title),
        featuresLabel: i18n._(msg`Features`),
        homeLabel: i18n._(msg`Home`),
        faqs: entry.faqs.map(faq => ({ question: i18n._(faq.question), answer: i18n._(faq.answer) })),
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt
    });

    const { comparisonRows } = entry;
    const { comparisonCategoryLabel } = entry;

    return (
        <main className="flex-1">
            <JsonLd data={breadcrumbSchema} />
            <JsonLd data={webPageSchema} />
            {isDefined(faqSchema) && <JsonLd data={faqSchema} />}
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={i18n._(entry.title)} locale={locale} />}
                heading={i18n._(entry.title)}
                locale={locale}
                tagline={i18n._(entry.tagline)}
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why this matters</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>{i18n._(entry.tagline)}</FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Budgie vs. the category</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    {entry.faqs.slice(0, 4).map((faq, index) => (
                        <FeaturePageBenefitGridItem index={index} key={i18n._(faq.question)}>
                            {i18n._(faq.answer)}
                        </FeaturePageBenefitGridItem>
                    ))}
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            {isDefined(comparisonRows) && isDefined(comparisonCategoryLabel) && (
                <FeaturePageSection>
                    <FeaturePageHeading>
                        <Trans>Feature comparison</Trans>
                    </FeaturePageHeading>
                    <FeaturePageCategoryComparison
                        categoryLabel={i18n._(comparisonCategoryLabel)}
                        rows={comparisonRows.map(row => ({
                            label: i18n._(row.label),
                            budgieValue: i18n._(row.budgieValue),
                            competitorValue: i18n._(row.competitorValue)
                        }))}
                    />
                </FeaturePageSection>
            )}

            <FeaturePageFaqSection>
                {entry.faqs.map(faq => (
                    <FeaturePageFaqItem answer={i18n._(faq.answer)} key={i18n._(faq.question)} question={i18n._(faq.question)} />
                ))}
            </FeaturePageFaqSection>

            <FeaturePageRelated features={related} locale={locale} />
            <FeaturePageRelatedArticles locale={locale} slugs={entry.relatedArticleSlugs} />

            <FeaturePageCta locale={locale} />
        </main>
    );
};
