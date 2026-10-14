/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Calendar, CircleQuestionMark, MousePointerClick, Tags } from 'lucide-react';
import Link from 'next/link';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureCropBand } from '../../../../feature/component/feature-crop-band/feature-crop-band';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureProof } from '../../../../feature/component/feature-proof/feature-proof';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function TagAnalyticsFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie Analytics Tags tab with an overview of spent, income and balance above an income-by-tag list and a spending-by-tag list, each row showing a total and its share of the period`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>See spending tag by tag</Trans>}
                tagline={
                    <Trans>
                        Switch to the Tags tab in Analytics for income and spending totalled tag by tag, each with its share of the period
                        and the transactions behind it.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="statistics-tags-tab-1" slug="statistics-tags-tab" />
            </FeaturePageHero>

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
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="statistics-tags-tab-1" slug="statistics-tags-tab">
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

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(
                            i18n
                        )`Budgie Analytics with the Categories and Tags tabs above the This Month filter chip and the overview of spent, income and balance`}
                        locale={lang}
                        scene="statistics-tags-tab-1"
                        slug="statistics-tags-tab"
                        y={0.07}
                    />
                }
                heading={<Trans>Same filters as Categories</Trans>}
                lede={<Trans>Switch tabs and the period and filters stay exactly where you set them.</Trans>}
            >
                <FeatureProof.Fact icon={Tags}>
                    <Trans>The Tags tab sits right beside Categories</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={Calendar}>
                    <Trans>One period and one set of filter chips for both</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Action href={`/${lang}/features/transaction-tags`}>
                    <Trans>See how tags work</Trans>
                </FeatureProof.Action>
            </FeatureProof>

            <FeatureCropBand
                heading={<Trans>Where the money went, per tag</Trans>}
                lede={<Trans>Income and spending get their own lists, each row with a total and a share.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(
                            i18n
                        )`Budgie Analytics Tags tab with an income-by-tag card and a spending-by-tag list where each row shows a total and a percentage of expenses`}
                        locale={lang}
                        scene="statistics-tags-tab-1"
                        slug="statistics-tags-tab"
                        y={0.4}
                    >
                        <FeatureCropBand.Pin x={0.6} y={0.427} />
                        <FeatureCropBand.Pin x={0.7} y={0.515} />
                        <FeatureCropBand.Pin x={0.75} y={0.59} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>Income totalled for each tag</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Spending listed separately below</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Each tag&apos;s share of expenses</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Tags} title={<Trans>Income and spending by tag</Trans>}>
                    <Trans>Income by tag and spending by tag, one tap from the Analytics tab bar</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={CircleQuestionMark} title={<Trans>See what has no tag</Trans>}>
                    <Trans>An Untagged row for whatever in the period carries no label, and the transactions behind it</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={MousePointerClick} title={<Trans>Tap through to transactions</Trans>}>
                    <Trans>Tap any row to open the transactions behind that tag for the active period</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>
                            Reads the same period and filters as the Categories tab — This Month, Last Month, This Year, a custom range and
                            the rest
                        </Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why category analytics alone leaves money unlabeled</Trans>}>
                    <p>
                        <Trans>
                            Category-based analytics answer what kind of expense a transaction is — groceries, transport, dining. Tags
                            answer a different and equally important question: what was it for? A dinner tagged as a #work-lunch, a
                            #vacation flight charged to the same &ldquo;Travel&rdquo; category as a commute, a shared dinner that needs a
                            #split label — these distinctions only surface when you have a dedicated tag reporting layer.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            The Tags tab in Budgie Analytics puts per-tag totals on the same screen as the category breakdown, reachable
                            with a single tap on the tab switcher. It lists income by tag and spending by tag separately, each row carrying
                            that tag&apos;s total for the active period and its share of it. Tapping a row opens the transactions behind it,
                            filtered to that tag. Whatever in the period carries no tag at all shows up as an Untagged row instead of
                            quietly disappearing.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>The Untagged row is the gap</Trans>}>
                    <p>
                        <Trans>
                            Untagged is not an error state — it is what is left over. Anything in the period carrying no tag is grouped into
                            a single Untagged row inside the list it belongs to, counted separately for income and for spending, so its
                            total sits beside the tags you did apply. Tapping it opens those transactions grouped by merchant, with tags
                            suggested from your history, so you can{' '}
                            <Link
                                className="font-semibold underline underline-offset-4"
                                href={`/${lang}/features/bulk-categorize-transactions`}
                            >
                                tag them in bulk
                            </Link>
                            . Budgie does not force you to tag everything, but it will not hide the gap either.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            The totals are a live query, so the Untagged row shrinks as you label transactions during a review pass.
                            Budgie&apos;s on-device suggestions propose tags on the transaction form itself, which is usually quicker than
                            picking each one by hand.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={2} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>How is this different from category analytics?</Trans>}
                    answer={
                        <Trans>
                            Categories answer &quot;what kind of expense&quot;; tags answer &quot;for what purpose&quot;. Both views live in
                            Analytics — switch between them with one tap. Categories give a structured budget view; tags give project-level
                            and context-level views.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>What&apos;s the Untagged bucket?</Trans>}
                    answer={
                        <Trans>
                            Whatever in the period has no tag at all. It appears as an Untagged row — one in the income list, one in the
                            spending list — and tapping it opens those transactions grouped by merchant, with suggested tags, so you can
                            label them in bulk.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Can I drill down from a tag?</Trans>}
                    answer={
                        <Trans>
                            Yes. Tapping a row opens the transaction list for that tag over the active period. A row belongs either to the
                            income list or to the spending list, and the list opens on that side.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Does this work with the date filter?</Trans>}
                    answer={
                        <Trans>
                            Yes — the Tags tab reads whatever period is active: This Month, Last Month, This Week, Last Week, Today, This
                            Year or All Time — or a custom range you pick on the calendar.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
