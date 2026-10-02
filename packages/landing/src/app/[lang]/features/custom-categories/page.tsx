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

export default async function CustomCategoriesFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Custom Spending Categories That Bend To You</Trans>}
                locale={lang}
                tagline={
                    <Trans>Create, merge, reassign, and reorder categories until they match how you actually think about money.</Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>The categories you actually use</Trans>}>
                    <Trans>
                        Three screens: the list that holds only the categories you made, the form where one gets renamed, and the picker
                        that folds two of them into one.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>This list is yours alone</Trans>}>
                    <Trans>
                        Settings &rsaquo; Categories shows the categories you created and nothing else — the built-in tree stays out of the
                        way until you need it. The ones you tag most transactions with sort to the top.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie Categories screen listing user-created categories with their icons above a search field`}
                    index={0}
                    locale={lang}
                    priority
                    scene="custom-categories-1"
                    slug="custom-categories"
                >
                    <FeatureStory.Callout y={0.216}>
                        <Trans>Only the ones you created</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.832}>
                        <Trans>Search as the list grows</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Edit it until it fits</Trans>}>
                    <Trans>
                        Change the name, tap the tile for a different icon. Renaming unlinks nothing — transactions hold on to the category
                        by id. Budgie keeps an English translation and a handful of search keywords beside the name, so the selector still
                        finds the category whatever you type into it.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Edit Category form showing the icon tile, the name field and the AI-generated translation and search keywords`}
                    index={1}
                    locale={lang}
                    scene="custom-categories-2"
                    slug="custom-categories"
                >
                    <FeatureStory.Callout y={0.342}>
                        <Trans>Rename it, nothing unlinks</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.487}>
                        <Trans>Keywords the selector searches on</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Merge without losing transactions</Trans>}>
                    <Trans>
                        Two categories that mean the same thing become one: pick the category to keep and every transaction moves across
                        before the other one goes. The picker offers the built-in tree alongside your own, or a new category made on the
                        spot.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie category picker open over the Edit Category form, listing the categories to merge into`}
                    index={2}
                    locale={lang}
                    scene="custom-categories-3"
                    slug="custom-categories"
                >
                    <FeatureStory.Callout y={0.64}>
                        <Trans>Search, or add one here</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.788}>
                        <Trans>Pick the one to keep</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why pre-baked category trees never fit</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Pre-baked category trees never fit. Budgie lets you build, rename, merge two categories into one (with
                        mass-reassignment), and delete with safe transaction migration.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The category selector reorders by popularity over time, so the categories you use most surface first. Bank-synced
                        transactions can pre-fill via MCC mapping; you can override at any time.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>
                            Create unlimited categories with a custom name and icon, plus AI-generated translation and search keywords
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Merge two categories into one with mass-reassignment of transactions</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Selector reorders by your usage frequency — the categories you tap most surface first</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>MCC mapping pre-fills bank-synced transactions; AI suggestions cover manual ones</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Safe deletion: prompts you to migrate or wipe transactions, never silently orphans</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Can I rename categories without losing data?</Trans>}
                    answer={
                        <Trans>
                            Yes. Rename is non-destructive — every transaction in the category keeps its link via the category ID, not the
                            name.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What does merging two categories do?</Trans>}
                    answer={
                        <Trans>
                            The merged-from category&apos;s transactions are reassigned to the merged-into category, and the empty category
                            is deleted. Reversible only by re-categorizing manually.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How does the popularity sort work?</Trans>}
                    answer={
                        <Trans>
                            The selector tracks how often each category is picked and reorders the list so the top tappers stay near the
                            top. The order is per-device.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I import a pre-built category tree?</Trans>}
                    answer={
                        <Trans>
                            Not directly, but CSV import with column mapping can populate categories on first import. After that, edit them
                            like any other.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
