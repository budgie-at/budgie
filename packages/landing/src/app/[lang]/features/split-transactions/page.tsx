/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ChartPie, Scissors, Tags } from 'reicon-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureCropBand } from '../../../../feature/component/feature-crop-band/feature-crop-band';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function SplitTransactionsFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie expense editor showing a $100 Whole Foods Market transaction split into Home Maintenance, Electronics & Gadgets and Groceries rows`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Split one bill across categories</Trans>}
                tagline={
                    <Trans>
                        That €87 supermarket bill was groceries and a phone charger. Split into multiple categories with a remaining-budget
                        indicator.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="split-transactions-1" slug="split-transactions" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Receipts rarely fit one category</Trans>}>
                    <Trans>
                        A supermarket run can carry groceries, a phone charger and a light fixture. Budgie splits the one transaction across
                        as many category rows as the receipt needs.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>One receipt, three categories</Trans>}>
                    <Trans>
                        Switch the expense to split mode and add a row per category. Each row carries its own icon, category and amount.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="split-transactions-1" slug="split-transactions">
                    <FeatureStory.Callout y={0.721}>
                        <Trans>Each split, its own category</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.908}>
                        <Trans>Confirm once it adds up</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>The remainder counts down</Trans>}>
                    <Trans>Use Add item to add another row; the label under the rows shows how much is still left to assign.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie split sheet with Home Maintenance and Electronics & Gadgets rows, an Add item button and a $62.50 left to assign label`}
                    index={1}
                    locale={lang}
                    scene="split-transactions-2"
                    slug="split-transactions"
                >
                    <FeatureStory.Callout y={0.852}>
                        <Trans>Add another category row</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.908}>
                        <Trans>What is left to assign</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureSpecTiles heading={<Trans>Every item in its right place</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>match needed before you can confirm</Trans>} value={<Trans>Exact</Trans>}>
                    <Trans>Confirm unlocks only when the rows add up to the full amount.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>amount left to assign</Trans>} value={<Trans>Live</Trans>}>
                    <Trans>The footer button shows the remainder until the split is complete.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>category per row, never repeated</Trans>} value={<Trans>One</Trans>}>
                    <Trans>A category already used in the split cannot be picked again.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureCropBand
                heading={<Trans>Allocate until nothing is left</Trans>}
                lede={<Trans>The split sheet keeps the running balance in front of you.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(i18n)`Budgie split sheet with two category rows, an Add item button and a $62.50 left to assign label`}
                        locale={lang}
                        scene="split-transactions-2"
                        slug="split-transactions"
                        y={0.66}
                    >
                        <FeatureCropBand.Pin x={0.58} y={0.72} />
                        <FeatureCropBand.Pin x={0.72} y={0.84} />
                        <FeatureCropBand.Pin x={0.8} y={0.905} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>Each row has its own category</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Add a row while money remains</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>What is still left to assign</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Scissors} title={<Trans>Unlimited splits per bill</Trans>}>
                    <Trans>Unlimited splits per transaction — every category gets its accurate share</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Tags} title={<Trans>Tags and comments per row</Trans>}>
                    <Trans>Each split row keeps its own tags and comment — fully independent</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ChartPie} title={<Trans>No double-counting in analytics</Trans>}>
                    <Trans>Analytics counts each split toward its own category — no double-counting</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>The footer button tracks what&apos;s left to allocate, then turns into Confirm Split once it adds up</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Works for both expense and income transactions</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why receipts mix categories</Trans>}>
                    <p>
                        <Trans>
                            Receipts mix categories. Without splits, you fudge — pick the dominant category and lose the breakdown.
                            Budgie&apos;s split modal lets you allocate fractions of the same transaction across as many categories as you
                            like.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            The footer button doubles as your running total — it reads &quot;$X left to assign&quot; until the split is
                            fully allocated, then it becomes Confirm Split. The original transaction becomes a parent with linked split
                            entries underneath.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>How many splits can I make per transaction?</Trans>}
                    answer={
                        <Trans>No limit. Add as many split rows as you need; the total must equal the original transaction amount.</Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Can splits have different tags?</Trans>}
                    answer={<Trans>Yes. Each split row keeps its own tags and comment, fully independent of the others.</Trans>}
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Does split mode work for income too?</Trans>}
                    answer={<Trans>Yes. Switch to split inside the income form just like the expense form.</Trans>}
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>What happens to analytics after splitting?</Trans>}
                    answer={
                        <Trans>
                            Each split row counts toward its own category in analytics — the parent transaction itself becomes invisible to
                            category sums (it&apos;s just the wrapper).
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
