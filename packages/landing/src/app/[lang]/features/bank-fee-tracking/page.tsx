import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { BankFeeTrackingBenefitsSection } from './bank-fee-tracking-benefits-section/bank-fee-tracking-benefits-section';
import { BankFeeTrackingDetailsSection } from './bank-fee-tracking-details-section/bank-fee-tracking-details-section';
import { BankFeeTrackingFaqSection } from './bank-fee-tracking-faq-section/bank-fee-tracking-faq-section';
import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function BankFeeTrackingFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie Edit Transfer screen for a $900 transfer from Main Checking to Emergency Savings with a Bank Fees & Charges fee sheet showing $4.50 and a Save fee button`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>See what your bank charges</Trans>}
                tagline={
                    <Trans>
                        Keep ATM fees, transfer fees, and card commissions visible in analytics without turning every transfer into an
                        expense.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="bank-fee-tracking-1" slug="bank-fee-tracking" />
            </FeaturePageHero>

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
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="bank-fee-tracking-1" slug="bank-fee-tracking">
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

            <FeatureSpecTiles heading={<Trans>Fees counted, transfers left alone</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>of your own money counted as spending</Trans>} value={<Trans>Never</Trans>}>
                    <Trans>Only the fee counts, so moving $900 between your accounts stays out of your expenses.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>transaction you add by hand can carry a fee</Trans>} value={<Trans>Every</Trans>}>
                    <Trans>Expenses, income and transfers, not only card purchases.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>category in your analytics</Trans>} value={<Trans>Own</Trans>}>
                    <Trans>Fees default to Bank Fees &amp; Charges, shown as its own line in analytics.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <BankFeeTrackingBenefitsSection />

            <BankFeeTrackingDetailsSection locale={lang} />

            <BankFeeTrackingFaqSection locale={lang} />
        </FeaturePageShell>
    );
}
