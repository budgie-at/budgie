/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Hourglass, Landmark, ShieldCheck } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function DepositTrackingFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie deposit account screen showing a $15,408.40 balance, a 4.35% interest rate, a January 1, 2027 maturity date, 120 days remaining and a $15,628.76 expected payout`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Savings deposits, kept separate</Trans>}
                tagline={
                    <Trans>
                        Track fixed-term savings as deposit accounts kept separate from everyday spending, with interest rate, maturity
                        date, days remaining, and expected payout.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="deposit-tracking-1" slug="deposit-tracking" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>A fixed term, tracked like an account</Trans>}>
                    <Trans>
                        Budgie keeps a term deposit separate from the accounts you spend from, and shows what it will pay at maturity.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>A deposit is not a savings account</Trans>}>
                    <Trans>
                        The account screen carries the current balance, the interest rate, the maturity date, the days remaining and a
                        calculated expected payout.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="deposit-tracking-1" slug="deposit-tracking">
                    <FeatureStory.Callout y={0.339}>
                        <Trans>Maturity date and days left</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.395}>
                        <Trans>Expected payout estimate</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Close it and the money moves</Trans>}>
                    <Trans>
                        Open the account menu and choose Close Deposit. Budgie moves the remaining balance to the destination you pick and
                        archives the deposit.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie deposit account screen with the account menu open showing the Edit and Close Deposit actions`}
                    index={1}
                    locale={lang}
                    scene="deposit-tracking-2"
                    slug="deposit-tracking"
                >
                    <FeatureStory.Callout y={0.183}>
                        <Trans>Edit the deposit details</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.221}>
                        <Trans>Close and move the balance</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Landmark} title={<Trans>Savings kept separate</Trans>}>
                    <Trans>Dedicated Deposit account type for fixed-term savings and locked principal</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Hourglass} title={<Trans>Days left and expected payout</Trans>}>
                    <Trans>Days remaining and expected payout shown from your balance, rate, and maturity date</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ShieldCheck} title={<Trans>Principal stays protected</Trans>}>
                    <Trans>Deposit principal is protected from normal expense spending and cannot go negative</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Interest rate and maturity date fields for each deposit account</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Close a deposit into a selected destination account with a transfer, then archive it</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>&ldquo;Include in net worth&rdquo; stays available when a deposit should or should not count</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why deposits need their own account type</Trans>}>
                    <p>
                        <Trans>
                            A deposit is not everyday cash. Budgie treats it as a distinct account type so the principal stays separate from
                            normal spending accounts while still appearing in your broader account list.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Deposit accounts store an optional annual interest rate and maturity date. The account details screen uses those
                            fields to show days remaining and an expected payout estimate, without pretending interest has automatically
                            posted.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Can I spend from a deposit account?</Trans>}
                    answer={
                        <Trans>
                            No. Deposit accounts are excluded from normal expense source selection, and Budgie prevents deposit balances
                            from becoming negative.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Does Budgie automatically accrue deposit interest?</Trans>}
                    answer={
                        <Trans>
                            No. Budgie stores the interest rate and maturity date, then calculates an expected payout estimate from the
                            current balance and days remaining. It does not automatically create interest transactions.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>How do I close a deposit?</Trans>}
                    answer={
                        <Trans>
                            Use the Close Deposit action, select the destination account, and confirm. Budgie transfers the remaining
                            deposit balance to that account and archives the deposit.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Can deposits be included in net worth?</Trans>}
                    answer={
                        <Trans>
                            Yes. Like other accounts, deposits have an &ldquo;include in net worth&rdquo; setting, so you can decide whether
                            a locked deposit belongs in your net worth view.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
