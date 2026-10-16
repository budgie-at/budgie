/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ChartPie, Star, Tags } from 'reicon-react';

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

export default async function TransactionTagsFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(i18n)`Budgie new expense form with the tag sheet open on a searchable grid of tag chips`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Layer tags on top of categories</Trans>}
                tagline={
                    <Trans>
                        Layer tags on top of categories. One transaction can be both Groceries (category) and #vacation, #shared, and
                        #reimbursable (tags).
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="transaction-tags-1" slug="transaction-tags" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>One transaction, two ways to file it</Trans>}>
                    <Trans>
                        Three screens: pick tags on the expense form, read them back on the list, then total them up under Analytics.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Tags are the second dimension</Trans>}>
                    <Trans>
                        A category says what you bought. A tag says which trip, which project, which person — chosen on the same form, from
                        your own flat list.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="transaction-tags-1" slug="transaction-tags">
                    <FeatureStory.Callout y={0.49}>
                        <Trans>Tags sit next to Category</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.637}>
                        <Trans>Search, or add a new one</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>The list keeps them visible</Trans>}>
                    <Trans>
                        Every tagged row carries one tag chip and a count of the rest, so a long list stays scannable without opening a
                        single transaction.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie transaction list where each row shows a tag chip beside its category and date`}
                    index={1}
                    locale={lang}
                    scene="transaction-tags-2"
                    slug="transaction-tags"
                >
                    <FeatureStory.Callout y={0.344}>
                        <Trans>One tag chip, plus a count</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Then the totals follow</Trans>}>
                    <Trans>
                        Analytics carries a Tags tab beside Categories: income and spending per tag, each with its share of the period.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie analytics Tags tab listing income and spending totals for each tag`}
                    index={2}
                    locale={lang}
                    scene="statistics-tags-tab-1"
                    slug="statistics-tags-tab"
                >
                    <FeatureStory.Callout y={0.123}>
                        <Trans>A Tags tab beside Categories</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.568}>
                        <Trans>Every tag, ranked by spend</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureSpecTiles heading={<Trans>Tags, by the numbers</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>on tags per transaction</Trans>} value={<Trans>No limit</Trans>}>
                    <Trans>Layer as many tags as you need on one expense.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>primary tag per transaction</Trans>} value="1">
                    <Trans>Promote one tag and it stands out as a highlighted pill.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>tag you use gets its own total</Trans>} value={<Trans>Every</Trans>}>
                    <Trans>Analytics lists spending per tag, plus an Untagged bucket.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureCropBand
                heading={<Trans>Scan tags without opening a row</Trans>}
                lede={<Trans>A tagged row shows one tag chip, plus a count when it has more.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(i18n)`Budgie transaction list with a category label and a tag chip on each row`}
                        locale={lang}
                        scene="transaction-tags-2"
                        slug="transaction-tags"
                        y={0.27}
                    >
                        <FeatureCropBand.Pin x={0.55} y={0.386} />
                        <FeatureCropBand.Pin x={0.58} y={0.425} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>Category says what you bought</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>The tag adds your own label</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Tags} title={<Trans>Flat, reusable tags</Trans>}>
                    <Trans>Tags are flat, reusable, and combine freely — no rigid hierarchy</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Star} title={<Trans>Primary tag stands out</Trans>}>
                    <Trans>One tag per transaction can be promoted to &ldquo;primary&rdquo; and stands out as a highlighted pill</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ChartPie} title={<Trans>Per-tag totals</Trans>}>
                    <Trans>Tag-based analytics: per-tag totals plus an &ldquo;Untagged&rdquo; bucket</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Selector stays open across multi-selections; commit with a Done pill</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Merge tags across the database — same mass-reassignment story as categories</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why categories alone are not enough</Trans>}>
                    <p>
                        <Trans>
                            Categories answer &ldquo;what kind of expense&rdquo;; tags answer &ldquo;for which project, person, or
                            purpose.&rdquo; Tag a stretch of transactions #vacation-2026 and the analytics tab gives you a per-tag P&amp;L
                            without rebuilding the category tree.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Promote one tag per transaction to &ldquo;primary&rdquo; — it shows as a highlighted pill on the transaction
                            list so you can scan at a glance. To change which tag is primary, open the tag selector and long-press a
                            different tag card there.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>How are tags different from categories?</Trans>}
                    answer={
                        <Trans>
                            Categories answer &ldquo;what kind of expense&rdquo;; tags answer &ldquo;for which project, person, or
                            purpose.&rdquo; Use both together — one transaction can be Groceries (category) AND #vacation #shared (tags).
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>How many tags can I add to a transaction?</Trans>}
                    answer={
                        <Trans>
                            No limit. Layer as many as you need; one of them can be promoted to &ldquo;primary&rdquo; so it stands out as a
                            highlighted pill on the transaction list.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>What does &ldquo;primary tag&rdquo; mean?</Trans>}
                    answer={
                        <Trans>
                            The primary tag shows as a highlighted pill on the transaction list so you can scan a long list for #vacation or
                            #shared without opening rows. Open the tag selector and long-press a tag card there to make it primary.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Can I rename or merge tags?</Trans>}
                    answer={
                        <Trans>
                            Both. Same flow as categories — rename is non-destructive; merge mass-reassigns the transactions and removes the
                            source tag.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
