/* eslint-disable max-lines-per-function */
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
import { createFeatureGenerateMetadata } from '../../../../feature/util/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function BalanceAdjustmentFeaturePage(props: PageLangParam) {
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
                        Type the balance your bank shows and Budgie books the difference as a dated Adjustment transaction — not a silent
                        edit to your history.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why a correction is not an expense</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Reality drifts from the ledger: a cash amount you forgot to record, a starting balance you estimated, a bank that
                        reports a number your history cannot reproduce. Most apps fix that by quietly overwriting the balance, rewriting the
                        past without a trace.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Budgie does the opposite. You type the true balance; Budgie compares it with the current one and books the
                        difference as a dated Adjustment transaction. The correction is visible, dated, and editable like any other row.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Set a target balance on any account and Budgie writes the difference as an Adjustment</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Adjustments are a first-class transaction type with their own read and edit screens</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>The correction carries the exchange rate of the day it was booked, so net worth stays consistent</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>
                            Adjustments are excluded from categorization rules, so reconciling never fires a rule built for spending
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Recalculate Balances in Settings rebuilds every cached balance from the transaction ledger</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>An audited trail — the past is corrected in the open, never silently overwritten</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Is an adjustment just another transaction?</Trans>}
                    answer={
                        <Trans>
                            Yes — a first-class one. It has its own transaction type, its own detail and edit screens, and its own icon. It
                            exists to correct a balance, so Budgie keeps it out of the categorization rules you write for real spending.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>When should I set a target balance?</Trans>}
                    answer={
                        <Trans>
                            When the displayed balance does not match reality — a cash withdrawal you forgot to log, a starting balance you
                            estimated, or a bank figure your history cannot reproduce. Type the true number and Budgie books the difference.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does an adjustment count as income or spending?</Trans>}
                    answer={
                        <Trans>
                            No. An adjustment is reconciliation, not cash flow. Budgie deliberately excludes adjustments from rule matching,
                            so correcting a balance never contaminates a rule you wrote for real income or expenses.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What does Recalculate Balances do?</Trans>}
                    answer={
                        <Trans>
                            Settings → Recalculate Balances clears the cached balance for every account and rebuilds it from the
                            transactions themselves — useful after an import or a run of edits when a cached figure has drifted.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I edit or remove an adjustment?</Trans>}
                    answer={
                        <Trans>
                            Yes. An adjustment opens in its own detail screen and edits like any other transaction, so you can change the
                            amount or remove it without touching the rest of your history.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
