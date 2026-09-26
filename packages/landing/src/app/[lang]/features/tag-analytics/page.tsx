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

export default async function TagAnalyticsFeaturePage(props: PageLangParam) {
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
                        Switch to the Tags tab in Analytics for income and spending totalled tag by tag, each with its share of the period
                        and the transactions behind it.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>The question a category cannot answer</Trans>}>
                    <Trans>
                        One screen: the Tags tab beside Categories, income totalled tag by tag, then spending, each with its share of the
                        period.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Categories cannot answer every question</Trans>}>
                    <Trans>
                        A category says what kind of expense something is. Which trip, which project, which person is a different question,
                        and that is what a tag records. Analytics keeps a Tags tab beside Categories, under the same period and filter
                        chips.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Analytics Tags tab with an overview of spent, income and balance above an income-by-tag list and a spending-by-tag list, each row showing a total and its share of the period`}
                    index={0}
                    locale={lang}
                    priority
                    scene="statistics-tags-tab-1"
                    slug="statistics-tags-tab"
                >
                    <FeatureStory.Callout index={0} y={0.123}>
                        <Trans>Tags, beside Categories</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.459}>
                        <Trans>Income totalled per tag</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={2} y={0.583}>
                        <Trans>Its share of the period</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Income and spending, tag by tag</Trans>}>
                    <Trans>
                        The tab splits in two: income by tag first, then spending by tag, each row a tag with its total for the period. The
                        same tag can appear on both lists, so a tag that earns and costs is not flattened into one figure.
                    </Trans>
                </FeatureStory.Step>

                <FeatureStory.Step index={2} title={<Trans>Every tag carries its share</Trans>}>
                    <Trans>
                        Under each total is that tag&apos;s share — of the period&apos;s income, or of its expenses. The shares can add up
                        past 100%, because a transaction can carry several tags and counts in full under each of them. Tapping a row opens
                        the transactions behind it.
                    </Trans>
                </FeatureStory.Step>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why category analytics alone leaves money unlabeled</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Category-based analytics answer what kind of expense a transaction is — groceries, transport, dining. Tags answer a
                        different and equally important question: what was it for? A dinner tagged as a #work-lunch, a #vacation flight
                        charged to the same &ldquo;Travel&rdquo; category as a commute, a shared dinner that needs a #split label — these
                        distinctions only surface when you have a dedicated tag reporting layer.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The Tags tab in Budgie Analytics puts per-tag totals on the same screen as the category breakdown, reachable with a
                        single tap on the tab switcher. It lists income by tag and spending by tag separately, each row carrying that
                        tag&apos;s total for the active period and its share of it. Tapping a row opens the transactions behind it, filtered
                        to that tag. Whatever in the period carries no tag at all shows up as an Untagged row instead of quietly
                        disappearing.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>The Untagged row is the gap</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Untagged is not an error state — it is what is left over. Anything in the period carrying no tag is grouped into a
                        single Untagged row inside the list it belongs to, counted separately for income and for spending, so its total sits
                        beside the tags you did apply. Tapping it opens those transactions, where you can add the missing label. Budgie does
                        not force you to tag everything, but it will not hide the gap either.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The totals are a live query, so the Untagged row shrinks as you label transactions during a review pass.
                        Budgie&apos;s on-device suggestions propose tags on the transaction form itself, which is usually quicker than
                        picking each one by hand.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Income by tag and spending by tag, one tap from the Analytics tab bar</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>An Untagged row for whatever in the period carries no label, and the transactions behind it</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>
                            Reads the same period and filters as the Categories tab — This Month, Last Month, This Year and the rest
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Tap any row to open the transactions behind that tag for the active period</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>How is this different from category analytics?</Trans>}
                    answer={
                        <Trans>
                            Categories answer &quot;what kind of expense&quot;; tags answer &quot;for what purpose&quot;. Both views live in
                            Analytics — switch between them with one tap. Categories give a structured budget view; tags give project-level
                            and context-level views.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What&apos;s the Untagged bucket?</Trans>}
                    answer={
                        <Trans>
                            Whatever in the period has no tag at all. It appears as an Untagged row — one in the income list, one in the
                            spending list — and tapping it opens those transactions so you can label them.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I drill down from a tag?</Trans>}
                    answer={
                        <Trans>
                            Yes. Tapping a row opens the transaction list for that tag over the active period. A row belongs either to the
                            income list or to the spending list, and the list opens on that side.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does this work with the date filter presets?</Trans>}
                    answer={
                        <Trans>
                            Yes — the Tags tab reads whatever period is active: This Month, Last Month, This Week, Last Week, Today, This
                            Year or All Time. There is no custom range.
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
