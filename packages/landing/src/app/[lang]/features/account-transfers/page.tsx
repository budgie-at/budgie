/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ArrowLeftRight, Coins, History } from 'lucide-react';

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

export default async function AccountTransfersFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie New Transfer screen with 250 entered above a row naming Main Checking as the source and Cash Wallet as the destination`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Move money, not expenses</Trans>}
                tagline={
                    <Trans>
                        Move money between your own accounts with automatic FX conversion and dual-amount display for cross-currency
                        transfers.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="account-transfers-1" slug="account-transfers" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Money moved, not money spent</Trans>}>
                    <Trans>
                        Three screens: the transfer form that names both accounts, the cross-currency pair with the rate it converted at,
                        and the analytics that counted neither side.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>A transfer is its own type</Trans>}>
                    <Trans>
                        You enter the amount once and pick both accounts on one row. Budgie saves a single transfer that debits one account
                        and credits the other — not an expense here and an income there that you have to remember to cancel out.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="account-transfers-1" slug="account-transfers">
                    <FeatureStory.Callout y={0.292}>
                        <Trans>One amount, entered once</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.578}>
                        <Trans>Both accounts on one row</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Two amounts, one rate</Trans>}>
                    <Trans>
                        When the accounts hold different currencies, what will land on the other side appears under the figure you typed.
                        The pill says which side you are driving — tap it to type the receiving amount instead — and the rate that produced
                        the pair is saved with the transfer.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie New Transfer screen converting 250 US dollars into euros, with the sending-currency pill and the conversion rate row`}
                    index={1}
                    locale={lang}
                    scene="account-transfers-2"
                    slug="account-transfers"
                >
                    <FeatureStory.Callout y={0.3}>
                        <Trans>Pin the side you type</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.605}>
                        <Trans>The rate it converted at</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Neither side counts as spending</Trans>}>
                    <Trans>
                        Analytics reads income and expense transactions only, so a transfer never inflates either total and never turns up
                        as a category. The one part that does count is a fee you attach to the transfer, because that money really did
                        leave.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie analytics screen where the spent and income totals and the category breakdown contain no transfer entries`}
                    index={2}
                    locale={lang}
                    scene="spending-analytics-1"
                    slug="spending-analytics"
                >
                    <FeatureStory.Callout y={0.32}>
                        <Trans>Spent and income stay clean</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.486}>
                        <Trans>Only real income appears here</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={ArrowLeftRight} title={<Trans>Never confused with spending</Trans>}>
                    <Trans>First-class Transfer transaction type — never confused with expense or income</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Coins} title={<Trans>Both currencies side by side</Trans>}>
                    <Trans>Cross-currency dual-amount display: pin send or receive, system computes the other</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={History} title={<Trans>Convert past entries later</Trans>}>
                    <Trans>Convert any expense or income to a transfer retroactively — no re-entry needed</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>The exchange rate is saved with the transfer, so both balances reconcile exactly</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Currency-mode pill switches whether you drive from send or receive direction</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why transfers must be a first-class type</Trans>}>
                    <p>
                        <Trans>
                            Transfers between your accounts are not income or expenses — and an app that treats them as such will mis-state
                            your spending. Budgie has a first-class Transfer transaction type with explicit source and destination accounts.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            For cross-currency transfers (e.g. USD to EUR), Budgie shows both amounts side by side and lets you pin either
                            side. Switch the &ldquo;currency mode&rdquo; pill to drive the conversion from send or receive direction.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Why is &ldquo;transfer&rdquo; a separate type?</Trans>}
                    answer={
                        <Trans>
                            Money moved between your own accounts is not income or expense. Treating transfers as expenses double-counts
                            your spending. Budgie&apos;s first-class Transfer type keeps your stats accurate.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>What about cross-currency transfers?</Trans>}
                    answer={
                        <Trans>
                            Both amounts are shown together (e.g. $1000 → €925). Pin either side; the exchange rate is saved on the transfer
                            so reconciliation across currencies stays exact.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Can I auto-link transfers from my bank?</Trans>}
                    answer={
                        <Trans>
                            Yes — see Smart Transfer Consolidation. Bank-synced debits and credits matching by amount, time window, and
                            counter-IBAN auto-merge into a single transfer.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Can I undo a transfer?</Trans>}
                    answer={
                        <Trans>
                            Long-press the transfer in the list and Edit or Delete. There is no second transaction to chase — editing or
                            deleting the transfer moves both account balances back together.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
