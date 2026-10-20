/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Key, Link2, ToggleOn } from 'reicon-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureCropBand } from '../../../../feature/component/feature-crop-band/feature-crop-band';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureProof } from '../../../../feature/component/feature-proof/feature-proof';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function BankIntegrationManagementFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie Connect Binance screen with the Get API Key row, a four-step setup list, and the API key and secret fields`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>One connection, all your accounts</Trans>}
                tagline={
                    <Trans>
                        Your Monobank card, your jars, and the deposit you opened last month all hang off one connection, so renewing a
                        token is a single edit, not a rebuild.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="binance-sync-1" slug="binance-sync" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>One key per bank, not per account</Trans>}>
                    <Trans>
                        Three screens: the credential you paste once, the bank screen that lists everything it unlocked, and the sync
                        controls each account keeps for itself.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Connect the bank once</Trans>}>
                    <Trans>
                        Setup asks for one credential and spells out how to scope it — for Binance, an API key and secret with reading
                        enabled and trading and withdrawals switched off. Budgie stores it on the bank, not on an account, and fetches
                        whatever that key can see.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="binance-sync-1" slug="binance-sync">
                    <FeatureStory.Callout y={0.22}>
                        <Trans>Generate it in Binance</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.893}>
                        <Trans>Then it fetches the accounts</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Every account behind that key</Trans>}>
                    <Trans>
                        The bank gets its own screen: the cards and jars synced from it, each with its balance and a switch that pauses one
                        account while its siblings keep going. A Monobank connection can pull the bank&apos;s account list again later and
                        offer only the accounts you have not added yet — no second token.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Monobank connection screen listing two cards and a jar with balances, sync switches, and Add deposit and Add accounts buttons`}
                    index={1}
                    locale={lang}
                    scene="monobank-sync-1"
                    slug="monobank-sync"
                >
                    <FeatureStory.Callout y={0.218}>
                        <Trans>One row per synced account</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.302}>
                        <Trans>Pause this one, keep the rest</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Each account keeps its own controls</Trans>}>
                    <Trans>
                        Open an account and its sync card is there: pause it, paste a fresh token — which lands on the shared connection and
                        clears the error counters of every account on it — or re-pull a window, from the last seven days up to the entire
                        history.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Account Settings screen for a Monobank card with the re-sync sheet open on entire history, 90, 30 and 7 days`}
                    index={2}
                    locale={lang}
                    scene="bank-resync-window-1"
                    slug="bank-resync-window"
                >
                    <FeatureStory.Callout y={0.638}>
                        <Trans>Reset and pull everything again</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.862}>
                        <Trans>Or just the last week</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(i18n)`Budgie Monobank connection screen listing two cards and a jar, each with a balance and a sync switch`}
                        locale={lang}
                        scene="monobank-sync-1"
                        slug="monobank-sync"
                        y={0.15}
                    />
                }
                heading={<Trans>Check it on the bank screen</Trans>}
                lede={<Trans>Open any connected bank and every account behind it is on one list.</Trans>}
            >
                <FeatureProof.Fact icon={ToggleOn}>
                    <Trans>Each account has its own sync switch</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={Key}>
                    <Trans>The token belongs to the connection, not an account</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Source />
            </FeatureProof>

            <FeatureCropBand
                heading={<Trans>Re-pull a window, not everything</Trans>}
                lede={<Trans>Any synced account can fetch again, from the last week to its entire history.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(i18n)`Budgie re-sync sheet offering the entire history, the last 90 days, 30 days and 7 days`}
                        locale={lang}
                        scene="bank-resync-window-1"
                        slug="bank-resync-window"
                        y={0.57}
                    >
                        <FeatureCropBand.Pin x={0.72} y={0.63} />
                        <FeatureCropBand.Pin x={0.62} y={0.715} />
                        <FeatureCropBand.Pin x={0.6} y={0.865} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>Start over from the full history</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Or the last 90 or 30 days</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Or just the last 7 days</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Link2} title={<Trans>One connection, many accounts</Trans>}>
                    <Trans>One connection behind many accounts — Monobank cards and jars, plus deposits you open under the same bank</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Key} title={<Trans>Renew a token once</Trans>}>
                    <Trans>Change the token once and every account on that connection follows</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ToggleOn} title={<Trans>Per-account sync switch</Trans>}>
                    <Trans>A connection screen listing its accounts with their balances and a per-account sync switch</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>
                            Monobank connections can add more accounts later without re-entering the token, with the ones you already have
                            filtered out
                        </Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Open a deposit straight from the connection, so it inherits the bank it belongs to</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>
                            Statement banks (PrivatBank, Erste) get a connection too, without a token, so imported accounts group under one
                            roof
                        </Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why the credential deserves its own object</Trans>}>
                    <p>
                        <Trans>
                            A bank token is not a property of one account — it is a property of your relationship with the bank. Budgie
                            models it that way: a connection holds the credential, and every account you sync from that bank points at it.
                            Banks you import statements from, such as PrivatBank and Erste, have no token at all.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            The payoff shows up the day your token expires. Enter the new one once and every account on that connection is
                            back online together, with their error counters cleared. If the token you paste already belongs to another
                            connection, the account is moved onto it instead of quietly creating a duplicate.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>One screen per bank</Trans>}>
                    <p>
                        <Trans>
                            Each bank section on the home screen has a shortcut into its connection. Inside you get the accounts that belong
                            to it, each with its icon, title, and current balance, and a switch to pause syncing for that account alone
                            while its siblings keep going.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            What the screen offers next depends on the bank. A Monobank connection can pull the bank&apos;s account list and
                            add whatever you left out the first time. Statement-based banks — PrivatBank and Erste — offer a file import
                            action instead. Monobank, PrivatBank and Erste connections can all open a new deposit account that starts out
                            attached to the same bank.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={2} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Do I have to re-add every account when my token expires?</Trans>}
                    answer={
                        <Trans>
                            No. The token lives on the connection, so updating it from any account&apos;s sync settings restores every
                            account sharing that connection at once.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Can jars and deposits sit on the same connection as my card?</Trans>}
                    answer={
                        <Trans>
                            Jars are a Monobank feature, and they sit next to your cards on its connection. Deposit accounts you open
                            yourself attach to a Monobank, PrivatBank or Erste connection and appear together with the rest on its screen.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>What happens if I close one of the accounts?</Trans>}
                    answer={
                        <Trans>
                            Only that account is affected. Archiving or deleting it never removes the connection, so its siblings keep
                            syncing with the same credential.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Does this work for banks I import statements from?</Trans>}
                    answer={
                        <Trans>
                            Yes. PrivatBank and Erste get their own connection as well, with no token: it is where the import action lives
                            and what keeps their accounts grouped together.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={4}
                    question={<Trans>Can I open a deposit from any connection?</Trans>}
                    answer={
                        <Trans>
                            From bank connections, yes. Crypto exchange connections do not offer deposit accounts, since the concept does
                            not map onto them.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
