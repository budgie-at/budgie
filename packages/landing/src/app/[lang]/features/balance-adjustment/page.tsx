/* eslint-disable max-lines-per-function */
import { Trans } from '@lingui/react/macro';
import { Coins, DocumentText, Scale } from 'reicon-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureVersus } from '../../../../feature/component/feature-versus/feature-versus';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function BalanceAdjustmentFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Fix a balance, keep history honest</Trans>}
                tagline={
                    <Trans>
                        Type the balance your bank shows and Budgie books the difference as a dated Adjustment transaction, not a silent
                        edit to your history.
                    </Trans>
                }
            />

            <FeatureSpecTiles heading={<Trans>One number in, one clean correction</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>number to type</Trans>} value={<Trans>One</Trans>}>
                    <Trans>Enter the balance your bank shows and Budgie works out the difference.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>row added for every fix</Trans>} value={<Trans>Dated</Trans>}>
                    <Trans>Open it, edit it or remove it later, like any other transaction.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>rules or spending totals touched</Trans>} value={<Trans>None</Trans>}>
                    <Trans>Adjustments are skipped by categorization rules and spending analytics.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureVersus
                heading={<Trans>Two ways to fix a balance</Trans>}
                lede={<Trans>Balances drift. What happens next is the difference.</Trans>}
            >
                <FeatureVersus.Without title={<Trans>Overwrite it</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Many apps just replace the number</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>The old balance quietly disappears</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>No trace of what changed</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Past reports can shift without notice</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Adjust it</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>You type the true balance</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>A dated Adjustment row is added</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Every correction stays visible</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Edit or remove it any time</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Scale} title={<Trans>Fix a balance in one step</Trans>}>
                    <Trans>Set a target balance on any account and Budgie writes the difference as an Adjustment</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Coins} title={<Trans>Net worth stays consistent</Trans>}>
                    <Trans>The correction carries the exchange rate of the day it was booked, so net worth stays consistent</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={DocumentText} title={<Trans>Corrections stay visible</Trans>}>
                    <Trans>An audited trail — the past is corrected in the open, never silently overwritten</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Adjustments are a first-class transaction type with their own read and edit screens</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>
                            Adjustments are excluded from categorization rules, so reconciling never fires a rule built for spending
                        </Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Recalculate Balances in Settings rebuilds every cached balance from the transaction ledger</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why a correction is not an expense</Trans>}>
                    <p>
                        <Trans>
                            Reality drifts from the ledger: a cash amount you forgot to record, a starting balance you estimated, a bank
                            that reports a number your history cannot reproduce. Most apps fix that by quietly overwriting the balance,
                            rewriting the past without a trace.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Budgie does the opposite. You type the true balance; Budgie compares it with the current one and books the
                            difference as a dated Adjustment transaction. The correction is visible, dated, and editable like any other row.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Is an adjustment just another transaction?</Trans>}
                    answer={
                        <Trans>
                            Yes — a first-class one. It has its own transaction type, its own detail and edit screens, and its own icon. It
                            exists to correct a balance, so Budgie keeps it out of the categorization rules you write for real spending.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>When should I set a target balance?</Trans>}
                    answer={
                        <Trans>
                            When the displayed balance does not match reality — a cash withdrawal you forgot to log, a starting balance you
                            estimated, or a bank figure your history cannot reproduce. Type the true number and Budgie books the difference.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Does an adjustment count as income or spending?</Trans>}
                    answer={
                        <Trans>
                            No. An adjustment is reconciliation, not cash flow. Budgie deliberately excludes adjustments from rule matching,
                            so correcting a balance never contaminates a rule you wrote for real income or expenses.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>What does Recalculate Balances do?</Trans>}
                    answer={
                        <Trans>
                            Settings → Recalculate Balances clears the cached balance for every account and rebuilds it from the
                            transactions themselves — useful after an import or a run of edits when a cached figure has drifted.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={4}
                    question={<Trans>Can I edit or remove an adjustment?</Trans>}
                    answer={
                        <Trans>
                            Yes. An adjustment opens in its own detail screen and edits like any other transaction, so you can change the
                            amount or remove it without touching the rest of your history.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
