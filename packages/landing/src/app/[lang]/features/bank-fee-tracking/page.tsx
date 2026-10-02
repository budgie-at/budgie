/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/util/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { BankFeeTrackingBenefitsSection } from './bank-fee-tracking-benefits-section/bank-fee-tracking-benefits-section';
import { BankFeeTrackingFaqSection } from './bank-fee-tracking-faq-section/bank-fee-tracking-faq-section';
import { BankFeeTrackingOverviewSection } from './bank-fee-tracking-overview-section/bank-fee-tracking-overview-section';
import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function BankFeeTrackingFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={featureName}
                locale={lang}
                tagline={
                    <Trans>
                        Keep ATM fees, transfer fees, and card commissions visible in analytics without turning every transfer into an
                        expense.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>A transfer can carry a cost</Trans>}>
                    <Trans>
                        Banks charge for moving your own money. Budgie keeps that charge attached to the transfer instead of inventing a
                        second expense.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>A fee is not a transfer</Trans>}>
                    <Trans>
                        Open the transfer and add a fee. It is filed under Bank Fees &amp; Charges and saved alongside the transfer, so the
                        $900 you moved stays $900.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Edit Transfer screen for a $900 transfer from Main Checking to Emergency Savings with a Bank Fees & Charges fee sheet showing $4.50 and a Save fee button`}
                    index={0}
                    locale={lang}
                    priority
                    scene="bank-fee-tracking-1"
                    slug="bank-fee-tracking"
                >
                    <FeatureStory.Callout y={0.812}>
                        <Trans>Attached to the transfer</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.876}>
                        <Trans>Saved with the fee</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>The transfer stays a transfer</Trans>}>
                    <Trans>
                        Analytics counts only the fee as spending and leaves the movement out, so shuffling $900 between your own accounts
                        never inflates your expenses.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie analytics spending-by-category list with Housing & Utilities first and Bank Fees & Charges second at $565.75`}
                    index={1}
                    locale={lang}
                    scene="bank-fee-tracking-2"
                    slug="bank-fee-tracking"
                >
                    <FeatureStory.Callout y={0.627}>
                        <Trans>Only fees are spending</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.765}>
                        <Trans>Counted as spending</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <BankFeeTrackingOverviewSection />
            <BankFeeTrackingBenefitsSection />
            <BankFeeTrackingFaqSection locale={lang} />
        </FeaturePageShell>
    );
}
