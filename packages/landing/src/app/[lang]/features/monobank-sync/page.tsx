/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageComparisonTable } from '../../../../feature/component/feature-page-comparison-table/feature-page-comparison-table';
import { FeaturePageFaqItem } from '../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function MonobankSyncFeaturePage(props: PageLangParam) {
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
                        Connect your Monobank account, choose how much history to pull to your device, and keep working offline. No
                        third-party aggregator in between.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>From one token to your home screen</Trans>}>
                    <Trans>Three screens: paste a personal token, pick the cards and jars you want, and watch them land on Home.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Paste one personal token</Trans>}>
                    <Trans>Budgie calls the Monobank API directly with a token you generate. No aggregator, no bank password.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie Connect Monobank screen with the Get API Token row and the token field`}
                    index={0}
                    locale={lang}
                    priority
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

                <FeatureStory.Step index={2} title={<Trans>Grouped under the bank</Trans>}>
                    <Trans>Home keeps the whole connection in one Monobank group, and the gear beside it opens the accounts again.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Clip
                    alt={t(i18n)`Screen recording of the Monobank group on the Budgie home screen opening its synced accounts`}
                    index={2}
                    locale={lang}
                    scene="monobank-sync-clip-1"
                    slug="monobank-sync"
                />
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why a direct connection matters more than convenience</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Monobank offers a public API, so Budgie talks to it directly from your phone using your token — no data broker in
                        between. New transactions arrive each time you open the app, and in the background at intervals your phone&apos;s
                        system decides.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Cross-currency transactions carry their original exchange rate. The counterparty account number Monobank reports
                        lets Budgie auto-merge the two sides of a transfer between accounts you own. The optional re-sync window lets you
                        re-pull just the last 7, 30 or 90 days when your data drifts, while your own comments and categories stay.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Direct connection to Monobank with your personal token — your token, your call</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>
                            Choose your history on first connect — 1, 3 or 6 months, a year, everything, or new transactions only — then
                            refreshes on app open and in the background
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Cross-currency transactions keep their original exchange rate</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Counterparty account numbers are kept, enabling smart transfer consolidation</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Windowed re-sync to fix drift while keeping your own comments, categories and tags</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>
                            Automatic transfer consolidation — both sides of a transfer between your accounts are detected from the
                            counterparty account and exchange rate, then merged into a single transfer
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={6}>
                        <Trans>Imported commissions become bank-fee entries, so fees stay in analytics after transfer consolidation</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={7}>
                        <Trans>Jars sync next to your cards, each one selectable on its own, with top-ups merged into transfers</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={8}>
                        <Trans>On iPhone, a long history import keeps running in the background with a progress notice</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Counterparty accounts and transfer consolidation</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Monobank reports the counterparty&apos;s account number on payments and transfers that have one. Budgie keeps it
                        with each transaction, which gives transfer matching its main signal: when the outgoing and incoming sides of the
                        same transfer point at the same account, they collapse into one transfer automatically.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The same matching runs between two banks and between a card and one of your jars: both sides are matched on the
                        counterparty account and exchange rate, then consolidated into a single transfer — no double-counting in your
                        spending stats, no manual cleanup needed.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Aggregator-based apps vs. Budgie + Monobank</Trans>
                </FeaturePageHeading>
                <FeaturePageComparisonTable rivalLabel={<Trans>Aggregator-based app</Trans>}>
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>Your token, in your local database</Trans>}
                        concern={<Trans>Token control</Trans>}
                        rival={<Trans>Held in the aggregator&apos;s credential vault</Trans>}
                    />
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>Original exchange rate kept</Trans>}
                        concern={<Trans>Exchange rate preserved</Trans>}
                        rival={<Trans>Often dropped or recomputed</Trans>}
                    />
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>Tracked as fee entries</Trans>}
                        concern={<Trans>Bank fees</Trans>}
                        rival={<Trans>Often merged into the main amount</Trans>}
                    />
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>Yes — enables transfer matching</Trans>}
                        concern={<Trans>Counterparty account kept</Trans>}
                        rival={<Trans>Rarely surfaced</Trans>}
                    />
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>None — Budgie talks to Monobank directly</Trans>}
                        concern={<Trans>Aggregator middleman</Trans>}
                        rival={<Trans>The aggregator sees every transaction</Trans>}
                    />
                </FeaturePageComparisonTable>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>How is this different from aggregator-based apps?</Trans>}
                    answer={
                        <Trans>
                            An aggregator sits between you and your bank, mirroring your transactions to its servers. Budgie talks to
                            Monobank directly from your phone using your token. Monobank sees the request; nothing else.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How often does it sync?</Trans>}
                    answer={
                        <Trans>
                            Budgie refreshes Monobank every time you open the app, and also in the background. In the background your
                            phone&apos;s system decides when to run it, so there is no fixed schedule and new transactions do not appear the
                            instant they happen.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How much history can I pull?</Trans>}
                    answer={
                        <Trans>
                            When you connect you pick 1, 3 or 6 months, a year, the whole period, or only new transactions. Monobank sends
                            about one month of history per minute for each account you selected, so a long history can take hours and runs
                            much slower while the app is closed. On iPhone it keeps going in the background.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Where does my Monobank token live?</Trans>}
                    answer={
                        <Trans>On your device, in Budgie&apos;s local database. It is never sent to a Budgie server — there is none.</Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I use multiple Monobank accounts?</Trans>}
                    answer={<Trans>Yes — one token grants access to all your Monobank accounts. Pick which to import per account.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>Do jars sync as well?</Trans>}
                    answer={
                        <Trans>
                            Yes. Jars are fetched alongside your cards and listed in their own section during setup, so you choose them one
                            by one. Topping a jar up from a card is detected as a transfer between your own accounts rather than counted as
                            spending.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if Monobank&apos;s API changes?</Trans>}
                    answer={
                        <Trans>Budgie is source-available, and the Monobank connection is kept current through regular releases.</Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
