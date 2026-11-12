/* eslint-disable max-lines-per-function */
import { Trans } from '@lingui/react/macro';
import { Bell, ChartLine, Coins, DocumentText } from 'reicon-react';

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

export default async function InzhurFundTrackingFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Your Inzhur funds, with the real return</Trans>}
                tagline={
                    <Trans>
                        Import your Inzhur operations export and Budgie rebuilds your cash, buys, sells, dividends and tax. Each fund page
                        shows what you hold, what it is worth and the return on what you paid.
                    </Trans>
                }
            />

            <FeatureSpecTiles heading={<Trans>One export, the whole picture</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>file to bring in</Trans>} value={<Trans>One</Trans>}>
                    <Trans>The operations export rebuilds your Inzhur cash account and every fund you hold.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>history to look back over</Trans>} value={<Trans>1M, 3M, All</Trans>}>
                    <Trans>Switch the chart range to see how a fund moved over a month, three months or since you started.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>where the data goes</Trans>} value={<Trans>Nowhere</Trans>}>
                    <Trans>Budgie reads the export on your phone and keeps the result on your phone.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureVersus
                heading={<Trans>Two ways to follow your funds</Trans>}
                lede={<Trans>Certificates are easy to buy and hard to keep track of.</Trans>}
            >
                <FeatureVersus.Without title={<Trans>Check the Inzhur app</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Funds sit apart from the rest of your money</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Your net worth leaves them out</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Dividends and tax are easy to lose track of</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>No view of return on what you paid</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Import it into Budgie</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>One export rebuilds cash and every fund</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Fund holdings count in your net worth</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Dividends and tax are recorded as transactions</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Each fund shows its return on what you paid</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={DocumentText} title={<Trans>A full ledger from one export</Trans>}>
                    <Trans>
                        Buys, sells, dividends and tax become transactions in your Inzhur cash account, and Budgie records each fund you
                        hold
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ChartLine} title={<Trans>Return on what you paid</Trans>}>
                    <Trans>A fund page shows your certificates, the price of each one and your return on what you paid</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Coins} title={<Trans>Dividends, gross and after tax</Trans>}>
                    <Trans>Each fund shows the dividends it paid, with the amount left after tax</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Bell} title={<Trans>A nudge when it is time to refresh</Trans>}>
                    <Trans>
                        If your last export is more than 30 days old and money has moved since, Budgie reminds you to import a new one
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Choose Inzhur when you add an account, pick the operations export and you are done</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Import again any time; entries you already have are not duplicated</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Past bank payments to Inzhur are linked to the matching rows in the export</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Every imported entry edits like a normal transaction</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item title={<Trans>How the history is valued</Trans>}>
                    <p>
                        <Trans>
                            Open Add account, choose Inzhur and follow the steps: export the operations statement from the Inzhur app, then
                            choose that file in Budgie. Budgie rebuilds your cash, buys and dividends from it and shows a summary of what it
                            recorded.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Fund history is valued from the trade prices in your statement. That way the chart and your return match what
                            you actually paid, not a guess. Latest prices are fetched, and the page shows the date they are from.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Fund accounts count in your net worth by default, converted to your base currency, next to your bank accounts,
                            deposits and other holdings. You can switch that off on any account.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    question={<Trans>How do I get my Inzhur data into Budgie?</Trans>}
                    answer={
                        <Trans>
                            Export the operations statement from the Inzhur app, then in Budgie add an account, choose Inzhur and pick the
                            file. Budgie shows what it recorded when the import finishes.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>What does a fund page show?</Trans>}
                    answer={
                        <Trans>
                            The number of certificates you hold, the price of each one with its date, a price chart you can view over a
                            month, three months or all time, your return on what you paid, and the dividends the fund paid, gross and after
                            tax.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>What if my export does not cover my full history?</Trans>}
                    answer={
                        <Trans>
                            Budgie tells you it was a partial export and that the balance before it was estimated. Export the full history
                            for exact numbers.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Are my Inzhur holdings part of my net worth?</Trans>}
                    answer={
                        <Trans>
                            Yes. Fund accounts are included in net worth by default, and you can exclude any account in its settings.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Does Budgie sync with my Inzhur account automatically?</Trans>}
                    answer={
                        <Trans>
                            No. You import the operations export yourself, and Budgie reminds you when your last import is more than 30 days
                            old and money has moved since.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Does my Inzhur data leave my phone?</Trans>}
                    answer={
                        <Trans>
                            Budgie reads the export on your phone and keeps the result there. Budgie only fetches the latest fund prices.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
