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

export default async function MccAutoCategoryFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>MCC Auto-Categorization</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Bank-synced transactions carry Merchant Category Codes; Budgie maps them to your category tree automatically — first
                        import, no setup.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Categories before you type</Trans>}>
                    <Trans>
                        Budgie turns the merchant category code the bank attaches to each card transaction into one of your own categories.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>The bank already told you what it was</Trans>}>
                    <Trans>
                        Every card transaction carries a merchant category code. Silpo arrives on the expense form with its Grocery code
                        shown under the merchant name.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie expense form for a $78.4 Silpo transaction showing the Grocery merchant category code under the merchant name and Groceries set as the category`}
                    index={0}
                    locale={lang}
                    priority
                    scene="mcc-auto-category-1"
                    slug="mcc-auto-category"
                >
                    <FeatureStory.Callout y={0.411}>
                        <Trans>The bank&apos;s category code</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Mapped to your tree</Trans>}>
                    <Trans>The code resolves to one of your categories — here Groceries — before you open the form.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie expense form for a $78.4 Silpo transaction showing the Grocery merchant category code under the merchant name and Groceries set as the category`}
                    index={1}
                    locale={lang}
                    scene="mcc-auto-category-1"
                    slug="mcc-auto-category"
                >
                    <FeatureStory.Callout y={0.543}>
                        <Trans>Mapped to your category</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Override once, remember forever</Trans>}>
                    <Trans>
                        Change the category and a Quick rule pill appears above the amount, offering to keep the override for that merchant.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie expense form for a $78.4 Silpo transaction with a Quick rule pill above the amount and Restaurants set as the category`}
                    index={2}
                    locale={lang}
                    scene="mcc-auto-category-2"
                    slug="mcc-auto-category"
                >
                    <FeatureStory.Callout y={0.267}>
                        <Trans>Quick rule offered</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.545}>
                        <Trans>Override the category</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why MCC is the universal merchant taxonomy</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        MCC is the universal merchant taxonomy banks already attach to every card transaction. Budgie ships an MCC →
                        category lookup so a coffee shop (MCC 5814) lands in your &quot;Food &amp; Drink&quot; without a single tap.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Per-MCC overrides let you bend the default mapping — point all 4111 (transit) into your &quot;Commute&quot; category
                        instead of &quot;Travel&quot; once and never touch it again.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Universal MCC → category lookup ships with sensible defaults</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Per-MCC overrides for personal preferences — set once, applies forever</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>MCC short and full description visible in the transaction edit form</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>AI category suggestion fills the gap for non-MCC transactions</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>PrivatBank&apos;s proprietary categories also map through the same MCC system</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>What&apos;s an MCC?</Trans>}
                    answer={
                        <Trans>
                            Merchant Category Code — the universal 4-digit code your bank attaches to every card transaction. 5814 is
                            &quot;fast food&quot;, 4111 is &quot;transit&quot;, 5411 is &quot;supermarket&quot;, and so on.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if I want my own category mapping?</Trans>}
                    answer={
                        <Trans>
                            Override per-MCC: point all 4111 (transit) into your &quot;Commute&quot; instead of the default
                            &quot;Travel&quot;. Override once, applies forever.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if the transaction has no MCC?</Trans>}
                    answer={
                        <Trans>
                            Manual entries don&apos;t have MCC; some bank-sync flows drop it. AI category suggestions handle those — see
                            On-Device AI Auto-Categorization.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I see the MCC on a transaction?</Trans>}
                    answer={
                        <Trans>Yes — the MCC short and full description appear in the transaction edit form for any bank-synced row.</Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
