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
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function MccAutoCategoryFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Bank codes sort your spending</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Bank-synced transactions carry Merchant Category Codes; Budgie maps them to your category tree automatically, first
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
                        MCC is the universal merchant taxonomy banks already attach to every card transaction. Budgie ships a lookup for
                        about 1,050 codes, so a cafe (MCC 5814) lands in &quot;Restaurants &amp; Cafes&quot;, a fuel stop (5541, 5542) in
                        &quot;Car &amp; Fuel&quot; and transit (4111) in &quot;Transportation&quot; without a single tap.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Want a different category? Change it once and tap the Quick rule pill to remember it for that merchant, or write a
                        rule on the merchant code yourself. Prefer to categorize everything by hand? Turn off &quot;Auto-assign categories
                        from MCC&quot; in Settings — it is on by default.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Default categories for about 1,050 merchant category codes, on by default</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Override a category once and a Quick rule remembers it for that merchant</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>The merchant category shows under the merchant name on the transaction form</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Suggestions from your own history fill the gap for transactions without a code</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>PrivatBank&apos;s own categories are translated to merchant codes too</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>What&apos;s an MCC?</Trans>}
                    answer={
                        <Trans>
                            Merchant Category Code — the universal 4-digit code your bank attaches to every card transaction. 5814 is
                            &quot;fast food&quot;, 4111 is &quot;transit&quot;, 5411 is &quot;grocery stores&quot;, and so on.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if I want my own category mapping?</Trans>}
                    answer={
                        <Trans>
                            Change the category on a transaction and tap the Quick rule pill: Budgie remembers your choice for that
                            merchant. To change a whole code at once, write a rule with the merchant code as the condition and pick your
                            category.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if the transaction has no MCC?</Trans>}
                    answer={
                        <Trans>
                            Manual entries don&apos;t have MCC; some bank-sync flows drop it. Suggestions from your own history help there,
                            and so do rules you write.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I see the MCC on a transaction?</Trans>}
                    answer={
                        <Trans>
                            Yes — the merchant category appears under the merchant name on the transaction form for any bank-synced row.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
