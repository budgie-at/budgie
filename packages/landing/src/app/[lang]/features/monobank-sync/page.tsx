/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ArrowSwapHorizontal, CloudCross, Plane, Refresh, Safe } from 'reicon-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureProof } from '../../../../feature/component/feature-proof/feature-proof';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { FeatureVersus } from '../../../../feature/component/feature-versus/feature-versus';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function MonobankSyncFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(i18n)`Budgie Connect Monobank screen with the Get API Token row and the token field`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Your Monobank, on your phone</Trans>}
                tagline={
                    <Trans>
                        Connect your Monobank account, choose how much history to pull to your device, and keep working offline. No
                        third-party aggregator in between.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="no-bank-login-budget-app-1" slug="no-bank-login-budget-app" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>From one token to your home screen</Trans>}>
                    <Trans>Three screens: paste a personal token, pick the cards and jars you want, and watch them land on Home.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Paste one personal token</Trans>}>
                    <Trans>Budgie calls the Monobank API directly with a token you generate. No aggregator, no bank password.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={firstShotAlt}
                    index={0}
                    locale={lang}
                    scene="no-bank-login-budget-app-1"
                    slug="no-bank-login-budget-app"
                >
                    <FeatureStory.Callout y={0.22}>
                        <Trans>Generate it in Monobank</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.506}>
                        <Trans>Kept in your local database</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Cards and jars arrive</Trans>}>
                    <Trans>Every Monobank card and every jar comes back as its own account, with a switch to leave any of them out.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie Monobank screen listing two cards and a car jar, each with a balance and a switch`}
                    index={1}
                    locale={lang}
                    scene="monobank-sync-1"
                    slug="monobank-sync"
                >
                    <FeatureStory.Callout y={0.218}>
                        <Trans>Each card with its balance</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.387}>
                        <Trans>Jars come across too</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureSpecTiles heading={<Trans>Everything Monobank knows, nothing extra in the loop</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>companies between you and your bank</Trans>} value="0">
                    <Trans>Budgie asks Monobank directly from your phone. Nobody else sees a single transaction.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>token for everything</Trans>} value="1">
                    <Trans>All cards and jars on one connection.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>history if you want it</Trans>} value={<Trans>Full</Trans>}>
                    <Trans>Pick how far back to go, from one month to the whole period.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureVersus
                heading={<Trans>Why skip the middleman</Trans>}
                lede={
                    <Trans>Many bank-sync apps route your bank through a data aggregator. Here is what changes when they don&apos;t.</Trans>
                }
            >
                <FeatureVersus.Without title={<Trans>Apps that use an aggregator</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Your bank access sits in someone else&apos;s vault</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Every transaction is copied to their servers</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Original exchange rates are often lost</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Fees often get folded into the amount</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Budgie with Monobank</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Your token, kept on your phone</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Transactions go from Monobank straight to you</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>The original amount stays on foreign purchases</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Fees show up as their own entries</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(
                            i18n
                        )`Budgie Settings screen with the 100% Offline & Private card saying all your data is stored on the device`}
                        locale={lang}
                        scene="ai-auto-categorization-2"
                        slug="ai-auto-categorization"
                        y={0.16}
                    />
                }
                heading={<Trans>Don&apos;t trust us. Check.</Trans>}
                lede={<Trans>Budgie is source-available, so anyone can read exactly what happens to your bank data.</Trans>}
            >
                <FeatureProof.Fact icon={Plane}>
                    <Trans>Turn on airplane mode: everything already synced still works</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={CloudCross}>
                    <Trans>There is no Budgie server to send anything to</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Source />
            </FeatureProof>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={ArrowSwapHorizontal} title={<Trans>Transfers that don&apos;t count twice</Trans>}>
                    <Trans>
                        Automatic transfer consolidation — both sides of a transfer between your accounts are detected from the counterparty
                        account and exchange rate, then merged into a single transfer
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Safe} title={<Trans>Jars next to your cards</Trans>}>
                    <Trans>Jars sync next to your cards, each one selectable on its own, with top-ups merged into transfers</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Refresh} title={<Trans>Fix drift without losing edits</Trans>}>
                    <Trans>Windowed re-sync to fix drift while keeping your own comments, categories and tags</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Direct connection to Monobank with your personal token — your token, your call</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>
                            Choose your history on first connect — 1, 3 or 6 months, a year, everything, or new transactions only — then
                            refreshes on app open and in the background
                        </Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Cross-currency transactions keep their original exchange rate</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Counterparty account numbers are kept, enabling smart transfer consolidation</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>On iPhone, a long history import keeps running in the background with a progress notice</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Imported commissions become bank-fee entries, so fees stay in analytics after transfer consolidation</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why a direct connection matters more than convenience</Trans>}>
                    <p>
                        <Trans>
                            Monobank offers a public API, so Budgie talks to it directly from your phone using your token — no data broker
                            in between. New transactions arrive each time you open the app, and in the background at intervals your
                            phone&apos;s system decides.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Cross-currency transactions carry their original exchange rate. The counterparty account number Monobank reports
                            lets Budgie auto-merge the two sides of a transfer between accounts you own. The optional re-sync window lets
                            you re-pull just the last 7, 30 or 90 days when your data drifts, while your own comments and categories stay.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>Counterparty accounts and transfer consolidation</Trans>}>
                    <p>
                        <Trans>
                            Monobank reports the counterparty&apos;s account number on payments and transfers that have one. Budgie keeps it
                            with each transaction, which gives transfer matching its main signal: when the outgoing and incoming sides of
                            the same transfer point at the same account, they collapse into one transfer automatically.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            The same matching runs between two banks and between a card and one of your jars: both sides are matched on the
                            counterparty account and exchange rate, then consolidated into a single transfer — no double-counting in your
                            spending stats, no manual cleanup needed.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={2} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>How is this different from aggregator-based apps?</Trans>}
                    answer={
                        <Trans>
                            An aggregator sits between you and your bank, mirroring your transactions to its servers. Budgie talks to
                            Monobank directly from your phone using your token. Monobank sees the request; nothing else.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>How often does it sync?</Trans>}
                    answer={
                        <Trans>
                            Budgie refreshes Monobank every time you open the app, and also in the background. In the background your
                            phone&apos;s system decides when to run it, so there is no fixed schedule and new transactions do not appear the
                            instant they happen.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>How much history can I pull?</Trans>}
                    answer={
                        <Trans>
                            When you connect you pick 1, 3 or 6 months, a year, the whole period, or only new transactions. Monobank sends
                            about one month of history per minute for each account you selected, so a long history can take hours and runs
                            much slower while the app is closed. On iPhone it keeps going in the background.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Where does my Monobank token live?</Trans>}
                    answer={
                        <Trans>On your device, in Budgie&apos;s local database. It is never sent to a Budgie server — there is none.</Trans>
                    }
                />
                <FeatureFaq.Item
                    index={4}
                    question={<Trans>Can I use multiple Monobank accounts?</Trans>}
                    answer={<Trans>Yes — one token grants access to all your Monobank accounts. Pick which to import per account.</Trans>}
                />
                <FeatureFaq.Item
                    index={5}
                    question={<Trans>Do jars sync as well?</Trans>}
                    answer={
                        <Trans>
                            Yes. Jars are fetched alongside your cards and listed in their own section during setup, so you choose them one
                            by one. Topping a jar up from a card is detected as a transfer between your own accounts rather than counted as
                            spending.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={6}
                    question={<Trans>What if Monobank&apos;s API changes?</Trans>}
                    answer={
                        <Trans>Budgie is source-available, and the Monobank connection is kept current through regular releases.</Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
