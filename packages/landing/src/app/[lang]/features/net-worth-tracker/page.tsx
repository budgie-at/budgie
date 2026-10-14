/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Coins, Scale, ToggleRight } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageComparisonTable } from '../../../../feature/component/feature-page-comparison-table/feature-page-comparison-table';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function NetWorthTrackerFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(i18n)`Budgie home screen with the total balance header above every account section`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Your net worth, one number</Trans>}
                tagline={
                    <Trans>
                        Bank, cash, deposit, crypto, and debt accounts all roll up into a single net-worth number on your home screen, with
                        multi-currency conversion baked in.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="net-worth-tracker-1" slug="net-worth-tracker" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Watch the number add up</Trans>}>
                    <Trans>Three screens, from the total on your home screen down to what you owe and what you are owed.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>One number, everything in it</Trans>}>
                    <Trans>Bank, cash, crypto and debt are already inside the figure at the top of Home.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="net-worth-tracker-1" slug="net-worth-tracker">
                    <FeatureStory.Callout y={0.175}>
                        <Trans>Total in your base currency</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.225}>
                        <Trans>Fiat and crypto, split out</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Every currency, one total</Trans>}>
                    <Trans>A euro account keeps its own currency. The figure on Home counts what it is worth in yours today.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie home screen with a euro-denominated account listed under a total balance shown in dollars`}
                    index={1}
                    locale={lang}
                    scene="multi-currency-1"
                    slug="multi-currency"
                >
                    <FeatureStory.Callout y={0.178}>
                        <Trans>Converted to your base currency</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.655}>
                        <Trans>The account keeps its own</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Debt counts, both directions</Trans>}>
                    <Trans>What you lent adds to your net worth. What you owe subtracts from it, down to the last repayment.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie home screen scrolled to the savings, you owe and owed to you groups with a subtotal on each one`}
                    index={2}
                    locale={lang}
                    scene="net-worth-tracker-2"
                    slug="net-worth-tracker"
                >
                    <FeatureStory.Callout y={0.392}>
                        <Trans>What you owe subtracts</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.596}>
                        <Trans>What you lent adds back</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Scale} title={<Trans>Debts counted automatically</Trans>}>
                    <Trans>Liability and debt accounts subtract automatically; receivables add</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Coins} title={<Trans>Every account in your currency</Trans>}>
                    <Trans>Background FX-rate refresh converts every account to your base currency</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ToggleRight} title={<Trans>Choose what counts</Trans>}>
                    <Trans>Per-account &ldquo;include in net worth&rdquo; toggle — partial-truth balance is your call</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Crypto holdings sit alongside your fiat accounts with the same UX</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why an expense tracker should also be a balance sheet</Trans>}>
                    <p>
                        <Trans>
                            Most expense apps stop at &ldquo;this month&apos;s spending.&rdquo; Budgie gives you the full balance-sheet view
                            — assets, liabilities, and the line they form between them — without spreadsheets.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Toggle &ldquo;include in net worth&rdquo; per account. A background task keeps exchange rates fresh so a Euro
                            savings account, a USDC wallet, and a UAH-denominated salary all show in your home currency.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>Most expense apps vs. Budgie</Trans>}>
                    <FeaturePageComparisonTable rivalLabel={<Trans>Most expense apps</Trans>}>
                        <FeaturePageComparisonTable.Row
                            budgie={<Trans>Bank + cash + deposit + crypto + debt</Trans>}
                            concern={<Trans>Asset coverage</Trans>}
                            rival={<Trans>Bank only</Trans>}
                        />
                        <FeaturePageComparisonTable.Row
                            budgie={<Trans>Per-account currency, background auto-conversion</Trans>}
                            concern={<Trans>FX support</Trans>}
                            rival={<Trans>One currency, often hardcoded</Trans>}
                        />
                        <FeaturePageComparisonTable.Row
                            budgie={<Trans>First-class — subtract from net worth</Trans>}
                            concern={<Trans>Liability accounts</Trans>}
                            rival={<Trans>Treated as expenses</Trans>}
                        />
                        <FeaturePageComparisonTable.Row
                            budgie={<Trans>Net worth trendline alongside</Trans>}
                            concern={<Trans>Time series</Trans>}
                            rival={<Trans>Spending only</Trans>}
                        />
                    </FeaturePageComparisonTable>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={2} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Where do exchange rates come from?</Trans>}
                    answer={
                        <Trans>
                            A background task pulls exchange rates automatically and stores a snapshot on your device. No live rate broker
                            is queried at render time.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Can I exclude an account from net worth?</Trans>}
                    answer={
                        <Trans>
                            Yes. Each account has an &ldquo;Include in net worth&rdquo; toggle so you can keep, say, a business escrow
                            account separate from your personal balance sheet.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>How do crypto holdings price?</Trans>}
                    answer={
                        <Trans>
                            Crypto holdings are valued from the market history Budgie stores on device and refreshes in the background, so
                            pricing stays available without a live rate broker.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Is the home screen number always accurate?</Trans>}
                    answer={
                        <Trans>
                            As accurate as your most-recent balance + FX rate. Manual accounts hold whatever balance you set; bank-synced
                            accounts reconcile every sync.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
