/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBreadcrumbsJsonLd } from '../../../../feature/component/feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
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

export default async function AiTagSuggestionsFeaturePage(props: PageLangParam) {
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
                        After selecting a category, the on-device model proposes up to three tags as tappable pill chips — with a lighter
                        fallback that answers while that model is still loading.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why manual tagging breaks down at scale</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Tags are the most powerful dimension in Budgie analytics — they let you slice spending by project, trip, person, or
                        purpose rather than just merchant or category. But their value only materializes when tagging is consistent.
                        Keyboards are slow, spelling varies, and the right tag name is easy to forget. The result is an analytics view full
                        of labeling gaps that make the data less actionable.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Automatic tag suggestions eliminate the friction without removing control. After you pick a category, Budgie looks
                        at the merchant name, the category, and how you have tagged similar transactions before, then proposes the three
                        most relevant tags as pill-shaped chips. A single tap adds the tag. You can still type new ones — the suggestions
                        are additive, not a replacement for the text field.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Two paths to a suggestion, so you rarely wait</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        The main path ranks candidates from the tags you already use by how well they fit the transaction in front of you —
                        catching phrasing variations that a simple text lookup would miss. It is prepared on demand, so the very first
                        suggestion after a pause waits a moment. While it is still warming up or busy with another request, a faster lookup
                        over your past tagged transactions takes over and answers without waiting.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Both paths run entirely on your device. No network call, no vendor profiling. Nothing about your tags is ever
                        uploaded — every suggestion comes from the tags you already use in Budgie.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Up to three tag suggestions as tappable pills after category selection — zero typing required</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>A second, lighter path answers whenever the main model is still loading or busy</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Additive interface — suggestions sit alongside the text field, never replacing it</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Fully offline — both paths run on your phone with no cloud dependency</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>How are tags chosen?</Trans>}
                    answer={
                        <Trans>
                            Budgie ranks candidates by how closely they match the way you tagged similar transactions before. The top three
                            become tappable pills.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if my phone is slow?</Trans>}
                    answer={
                        <Trans>
                            A lighter fallback proposes tags from a lookup over your own tagged history, so suggestions appear instantly
                            even while the larger model is still warming up.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I add new tags from the suggestion strip?</Trans>}
                    answer={<Trans>Yes — typing a new tag still works in parallel; the suggestions are additive, not exclusive.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>Does this work offline?</Trans>}
                    answer={<Trans>Yes. Both paths run on your phone.</Trans>}
                />
            </FeaturePageFaqSection>

            <FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
