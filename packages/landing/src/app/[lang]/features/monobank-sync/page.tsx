/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ArrowLeftRight, PiggyBank, RefreshCw } from 'lucide-react';

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
                        Connect your Monobank account, pull a full transaction history straight to your device, and keep working offline. No
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

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={ArrowLeftRight} title={<Trans>Transfers that don&apos;t count twice</Trans>}>
                    <Trans>
                        Automatic Transfer Consolidation — both legs of a cross-bank transfer are detected via counter-IBAN and
                        exchange-rate matching, then merged into a single transfer entry
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={PiggyBank} title={<Trans>Jars next to your cards</Trans>}>
                    <Trans>Jars sync next to your cards, each one selectable on its own, with top-ups merged into transfers</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={RefreshCw} title={<Trans>Fix drift without losing edits</Trans>}>
                    <Trans>Windowed re-sync to fix drift without losing manual edits</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Direct Monobank Personal API — your token, your call</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Full historical sync on first connect, then incremental every 30 minutes</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Cross-currency transactions preserve original FX rate per leg</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Counter-IBAN stored from the corr_iban field, enabling smart transfer-pair consolidation</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Imported commissions become bank-fee entries, so fees stay in analytics after transfer consolidation</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why direct API matters more than convenience</Trans>}>
                    <p>
                        <Trans>
                            Monobank exposes a clean public API, so Budgie talks to it directly from your phone using your token — no Plaid,
                            no data broker. Every transaction lands on your phone the moment it arrives.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Cross-currency transactions carry their original FX rate. Counter-party IBANs are stored, which lets Budgie
                            auto-merge transfer pairs across two accounts you own. The optional re-sync window lets you re-pull just the
                            last N days when your data drifts — without nuking manual edits.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>Counter-IBAN enrichment and transfer consolidation</Trans>}>
                    <p>
                        <Trans>
                            Monobank&apos;s API returns a corr_iban field on every transaction that has a counterparty IBAN — outgoing
                            payments, bank transfers, and peer-to-peer moves all carry it. Budgie stores this field per transaction leg,
                            which gives the transfer-pair detector a primary signal: when the debit side and credit side of the same
                            transfer both reference the same IBAN, they collapse into one transfer automatically.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            The same matching runs between two banks and between a card and one of your jars: both legs are detected via
                            counter-IBAN and exchange-rate matching, then consolidated into a single transfer — no double-counting in your
                            spending stats, no manual cleanup needed.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={2} title={<Trans>Plaid-based apps vs. Budgie + Monobank</Trans>}>
                    <FeaturePageComparisonTable rivalLabel={<Trans>Plaid-based app</Trans>}>
                        <FeaturePageComparisonTable.Row
                            budgie={<Trans>Your token, in your local database</Trans>}
                            concern={<Trans>Token control</Trans>}
                            rival={<Trans>Plaid-managed credential vault</Trans>}
                        />
                        <FeaturePageComparisonTable.Row
                            budgie={<Trans>Original FX kept per leg</Trans>}
                            concern={<Trans>FX preserved</Trans>}
                            rival={<Trans>Often dropped or recomputed</Trans>}
                        />
                        <FeaturePageComparisonTable.Row
                            budgie={<Trans>Tracked as fee entries</Trans>}
                            concern={<Trans>Bank fees</Trans>}
                            rival={<Trans>Often merged into the main amount</Trans>}
                        />
                        <FeaturePageComparisonTable.Row
                            budgie={<Trans>Yes — enables transfer-pair detection</Trans>}
                            concern={<Trans>Counter-IBAN stored</Trans>}
                            rival={<Trans>Rarely surfaced</Trans>}
                        />
                        <FeaturePageComparisonTable.Row
                            budgie={<Trans>None — Budgie talks to Monobank directly</Trans>}
                            concern={<Trans>Aggregator middleman</Trans>}
                            rival={<Trans>Plaid (or similar) sees every transaction</Trans>}
                        />
                    </FeaturePageComparisonTable>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={3} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>How is this different from Plaid-based apps?</Trans>}
                    answer={
                        <Trans>
                            Plaid sits between you and your bank, mirroring all your transactions to its servers. Budgie talks to
                            Monobank&apos;s API directly from your phone using your token. Monobank sees the request; nothing else.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Where does my Monobank token live?</Trans>}
                    answer={
                        <Trans>
                            On your device. When you set a PIN, that PIN is held in your platform&apos;s keystore and is what your data is
                            encrypted with; the token itself is never sent to a Budgie server (we have none).
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Can I use multiple Monobank accounts?</Trans>}
                    answer={<Trans>Yes — one token grants access to all your Monobank accounts. Pick which to import per account.</Trans>}
                />
                <FeatureFaq.Item
                    index={3}
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
                    index={4}
                    question={<Trans>What if Monobank&apos;s API changes?</Trans>}
                    answer={
                        <Trans>
                            Budgie is open source. The Monobank integration lives in packages/sync/src/monobank/ and the project&apos;s
                            release cadence keeps it current.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
