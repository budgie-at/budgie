/* eslint-disable max-lines-per-function */
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
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

const SLUG = 'ai-tag-suggestions';

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

export default async function AiTagSuggestionsFeaturePage(props: PageLangParam) {
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
                heading={i18n._(entry.title)}
                locale={lang}
                tagline={
                    <Trans>
                        After selecting a category, the on-device LLM proposes up to three tags as tappable pill chips — with an embedding
                        fallback that stays instant even when the model is still warming up.
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
                        Automatic tag suggestions eliminate the friction without removing control. After you pick a category, the on-device
                        LLM looks at the merchant name, category, and your historical tagging patterns to propose the three most relevant
                        tags as pill-shaped chips. A single tap adds the tag. You can still type new ones — the suggestions are additive,
                        not a replacement for the text field.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>LLM primary, embedding fallback — always fast</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        The primary engine is the on-device Qwen3 1.7B language model. It ranks tag candidates from your existing tag
                        vocabulary by semantic similarity to the transaction context — matching phrasing variations that a simple text
                        lookup would miss. When the LLM is still loading or busy with another inference, the embedding fallback takes over:
                        a nearest-neighbor lookup over 768-dimensional embeddings of your past tagged transactions, running in milliseconds
                        without waiting for the LLM.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Both engines run entirely on your device. No network call, no vendor profiling. The LLM never sees a raw tag
                        vocabulary upload — it reasons from the transaction context and returns ranked suggestions from the tags you already
                        use in Budgie.
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
                        <Trans>LLM-powered ranking with embedding fallback keeps suggestions instant on any device</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Additive interface — suggestions sit alongside the text field, never replacing it</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Fully offline — both engines run on-device with no cloud dependency</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection>
                <FeaturePageFaqItem
                    question={<Trans>How are tags chosen?</Trans>}
                    answer={
                        <Trans>
                            The LLM ranks candidates by similarity to your past tag usage on similar transactions. The top three become
                            tappable pills.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if the LLM is slow on my phone?</Trans>}
                    answer={
                        <Trans>
                            The embedding fallback runs in milliseconds and proposes the same tags from a 768-dim nearest-neighbor lookup
                            over your history.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I add new tags from the suggestion strip?</Trans>}
                    answer={<Trans>Yes — typing a new tag still works in parallel; the suggestions are additive, not exclusive.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>Does this work offline?</Trans>}
                    answer={<Trans>Yes. Both engines run on-device.</Trans>}
                />
            </FeaturePageFaqSection>

            <FeaturePageRelated features={related} locale={lang} />
            <FeaturePageRelatedArticles locale={lang} slugs={entry.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
