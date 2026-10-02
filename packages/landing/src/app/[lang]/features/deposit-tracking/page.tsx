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

export default async function DepositTrackingFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Deposit Tracking</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Track fixed-term savings as deposit accounts kept separate from everyday spending, with interest rate, maturity
                        date, days remaining, and expected payout.
                    </Trans>
                }
            />

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
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie deposit account screen showing a $15,408.40 balance, a 4.35% interest rate, a January 1, 2027 maturity date, 120 days remaining and a $15,628.76 expected payout`}
                    index={0}
                    locale={lang}
                    priority
                    scene="deposit-tracking-1"
                    slug="deposit-tracking"
                >
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

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why deposits need their own account type</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        A deposit is not everyday cash. Budgie treats it as a distinct account type so the principal stays separate from
                        normal spending accounts while still appearing in your broader account list.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Deposit accounts store an optional annual interest rate and maturity date. The account details screen uses those
                        fields to show days remaining and an expected payout estimate, without pretending interest has automatically posted.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Dedicated Deposit account type for fixed-term savings and locked principal</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Interest rate and maturity date fields for each deposit account</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Days remaining and expected payout shown from your balance, rate, and maturity date</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Close a deposit into a selected destination account with a transfer, then archive it</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Deposit principal is protected from normal expense spending and cannot go negative</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>&ldquo;Include in net worth&rdquo; stays available when a deposit should or should not count</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Can I spend from a deposit account?</Trans>}
                    answer={
                        <Trans>
                            No. Deposit accounts are excluded from normal expense source selection, and Budgie prevents deposit balances
                            from becoming negative.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does Budgie automatically accrue deposit interest?</Trans>}
                    answer={
                        <Trans>
                            No. Budgie stores the interest rate and maturity date, then calculates an expected payout estimate from the
                            current balance and days remaining. It does not automatically create interest transactions.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How do I close a deposit?</Trans>}
                    answer={
                        <Trans>
                            Use the Close Deposit action, select the destination account, and confirm. Budgie transfers the remaining
                            deposit balance to that account and archives the deposit.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can deposits be included in net worth?</Trans>}
                    answer={
                        <Trans>
                            Yes. Like other accounts, deposits have an &ldquo;include in net worth&rdquo; setting, so you can decide whether
                            a locked deposit belongs in your net worth view.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
