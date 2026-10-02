/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageFaqItem } from '../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/util/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function TransactionTagsFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Transaction Tags for Multi-Dimensional Tracking</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Layer tags on top of categories — one transaction can be both Groceries (category) and #vacation, #shared, and
                        #reimbursable (tags).
                    </Trans>
                }
            />

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
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie new expense form with the tag sheet open on a searchable grid of tag chips`}
                    index={0}
                    locale={lang}
                    priority
                    scene="transaction-tags-1"
                    slug="transaction-tags"
                >
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

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why categories alone are not enough</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Categories answer &ldquo;what kind of expense&rdquo;; tags answer &ldquo;for which project, person, or
                        purpose.&rdquo; Tag a stretch of transactions #vacation-2026 and the analytics tab gives you a per-tag P&amp;L
                        without rebuilding the category tree.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Promote one tag per transaction to &ldquo;primary&rdquo; — it shows as a highlighted pill on the transaction list so
                        you can scan at a glance. To change which tag is primary, open the tag selector and long-press a different tag card
                        there.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Tags are flat, reusable, and combine freely — no rigid hierarchy</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>One tag per transaction can be promoted to &ldquo;primary&rdquo; and stands out as a highlighted pill</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Selector stays open across multi-selections; commit with a Done pill</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Merge tags across the database — same mass-reassignment story as categories</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Tag-based analytics: per-tag totals plus an &ldquo;Untagged&rdquo; bucket</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>How are tags different from categories?</Trans>}
                    answer={
                        <Trans>
                            Categories answer &ldquo;what kind of expense&rdquo;; tags answer &ldquo;for which project, person, or
                            purpose.&rdquo; Use both together — one transaction can be Groceries (category) AND #vacation #shared (tags).
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How many tags can I add to a transaction?</Trans>}
                    answer={
                        <Trans>
                            No limit. Layer as many as you need; one of them can be promoted to &ldquo;primary&rdquo; so it stands out as a
                            highlighted pill on the transaction list.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What does &ldquo;primary tag&rdquo; mean?</Trans>}
                    answer={
                        <Trans>
                            The primary tag shows as a highlighted pill on the transaction list so you can scan a long list for #vacation or
                            #shared without opening rows. Open the tag selector and long-press a tag card there to make it primary.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I rename or merge tags?</Trans>}
                    answer={
                        <Trans>
                            Both. Same flow as categories — rename is non-destructive; merge mass-reassigns the transactions and removes the
                            source tag.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
