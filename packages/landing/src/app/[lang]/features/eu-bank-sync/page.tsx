/* eslint-disable max-lines-per-function */
import { Trans } from '@lingui/react/macro';
import { History, Refresh, Server, ShieldCheck } from 'reicon-react';

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

export default async function EuBankSyncFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>EU bank sync, straight to your phone</Trans>}
                tagline={
                    <Trans>
                        Connect banks such as N26 and Trade Republic through your own Enable Banking application. Transactions go from your
                        bank to your phone and never pass through a Budgie server.
                    </Trans>
                }
            />

            <FeatureSpecTiles heading={<Trans>Your bank, your application, your phone</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>Budgie servers in the path</Trans>} value={<Trans>None</Trans>}>
                    <Trans>Requests go from your phone to Enable Banking and your bank.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>application used to connect</Trans>} value={<Trans>Your own</Trans>}>
                    <Trans>You create it in your Enable Banking account, so the connection belongs to you.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>access to your accounts</Trans>} value={<Trans>Read-only</Trans>}>
                    <Trans>Budgie reads balances and history. It cannot move money.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureVersus
                heading={<Trans>Two ways to connect a bank</Trans>}
                lede={<Trans>Who sits between your bank and your budget decides who sees your data.</Trans>}
            >
                <FeatureVersus.Without title={<Trans>Through a shared service</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Your transactions pass through the app maker&apos;s servers</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>One shared connection for every customer</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>You trust the vendor to keep your bank access safe</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Through your own application</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Data goes from your bank to your phone</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>The connection is created and owned by you</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Budgie holds no bank credentials and has no server to leak them</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Server} title={<Trans>No Budgie server in between</Trans>}>
                    <Trans>
                        Requests go from your phone to Enable Banking, which talks to your bank. Budgie has no server to route them
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ShieldCheck} title={<Trans>You consent at your bank</Trans>}>
                    <Trans>You approve access with your bank, and Budgie never holds your bank login</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={History} title={<Trans>Continue an account, keep its history</Trans>}>
                    <Trans>
                        Connect a bank account to one you already track and it syncs forward from the day after its last transaction
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Refresh} title={<Trans>Renew consent when it ends</Trans>}>
                    <Trans>Budgie shows the date your consent ends and lets you authorize again in one tap</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Offered during onboarding, next to Monobank and statement import</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Banks from your country are listed first, and you can search the rest by name</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Works alongside Monobank and Binance sync in the same net worth</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Disconnect any time from the bank connection screen</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item title={<Trans>Why your own application matters</Trans>}>
                    <p>
                        <Trans>
                            Most budgeting apps connect to your bank through one shared account that the app maker owns. Your transactions
                            pass through their servers, and their service holds the access to your bank.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Budgie works the other way round. You create a personal application in your own Enable Banking account and keep
                            its key in your phone&apos;s secure storage. Budgie has no server, so there is nothing of ours between your bank
                            and your phone, and nothing for us to see, keep or lose.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item title={<Trans>How setup works</Trans>}>
                    <p>
                        <Trans>
                            Budgie walks you through a one-time setup of about five minutes. You sign in to Enable Banking, add a new
                            application, and copy the values Budgie shows you into the form. Then you download the key file and choose it in
                            Budgie.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Next, link your accounts in Enable Banking and log in to your bank to give consent. Back in Budgie, choose your
                            bank, pick the accounts to sync and decide whether each one starts a new account or continues one you already
                            have. Each further bank is linked the same way.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item title={<Trans>Consent, renewal and personal use</Trans>}>
                    <p>
                        <Trans>
                            Bank consent does not last forever, and how long it lasts depends on the bank. Budgie shows the date your
                            consent is valid until and warns you when it is close to ending. When it ends, tap Authorize again to renew it.
                            Your existing transactions stay.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            This connection is for personal accounts only. Enable Banking&apos;s terms allow it for private individuals
                            using their own accounts, and you accept them when you connect.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    question={<Trans>Which banks can I connect?</Trans>}
                    answer={
                        <Trans>
                            EU banks such as N26 and Trade Republic, among others. Budgie lists the banks Enable Banking offers, with the
                            banks from your country first, and you can search by name. A few banks need extra steps that Budgie does not
                            support yet, and those are not listed.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Does my bank data pass through a Budgie server?</Trans>}
                    answer={
                        <Trans>
                            No. Budgie has no server. Requests go from your phone to Enable Banking and your bank, and the transactions
                            arrive on your phone.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Does Budgie hold my bank login?</Trans>}
                    answer={
                        <Trans>
                            No. You give consent at your bank. The key for your own application stays in your phone&apos;s secure storage,
                            and Budgie only reads your accounts.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Why do I have to create my own application?</Trans>}
                    answer={
                        <Trans>
                            Because that is what keeps Budgie out of the path. The connection is yours, so there is no shared Budgie account
                            that sees everyone&apos;s data. Setup is a one-time job of about five minutes, guided step by step.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>What happens when my bank consent expires?</Trans>}
                    answer={
                        <Trans>
                            Syncing for that bank stops and Budgie tells you the consent has expired. Tap Authorize again, approve it at
                            your bank, and syncing resumes. Transactions already in Budgie are not affected.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Can I keep the history of an account I already track?</Trans>}
                    answer={
                        <Trans>
                            Yes. When you connect, you can choose an existing account instead of creating a new one. It keeps its history
                            and syncs forward from the day after its last transaction.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Can I use it with Monobank and Binance?</Trans>}
                    answer={
                        <Trans>
                            Yes. EU banks, Monobank and Binance can all be connected at once, and their accounts show up together in your
                            budget and net worth.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
