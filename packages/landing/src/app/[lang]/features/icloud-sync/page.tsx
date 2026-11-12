/* eslint-disable max-lines-per-function */
import { Trans } from '@lingui/react/macro';
import { Mobile, Refresh, ShieldCheck, WifiOff } from 'reicon-react';

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

export default async function IcloudSyncFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Your iPhone and iPad, in sync through your own iCloud</Trans>}
                tagline={
                    <Trans>
                        Budgie backs up and syncs automatically, with your financial data encrypted on your device before it leaves. No
                        Budgie account and no Budgie server.
                    </Trans>
                }
            />

            <FeatureSpecTiles heading={<Trans>Sync that stays out of your way</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>Budgie accounts needed</Trans>} value={<Trans>None</Trans>}>
                    <Trans>Your own iCloud is the only place your data goes besides your devices.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>when you are offline</Trans>} value={<Trans>Keep going</Trans>}>
                    <Trans>Add and edit as usual. Your devices catch up when you are back online, even after days.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>to turn it off</Trans>} value={<Trans>One switch</Trans>}>
                    <Trans>Sync across devices lives in Settings.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureVersus
                heading={<Trans>Two ways to sync a budget</Trans>}
                lede={<Trans>Where your transactions travel is the difference.</Trans>}
            >
                <FeatureVersus.Without title={<Trans>Vendor cloud</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>You create an account with the app maker</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Your ledger sits on their servers</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Sync stops if the service closes</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Offline use is often limited</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Your own iCloud</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>You sign in with the Apple ID you already use</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Data is encrypted on your device first</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>There is no Budgie server to shut down</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Everything works offline and catches up later</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Refresh} title={<Trans>Devices stay in step</Trans>}>
                    <Trans>Add an expense on your iPhone and it shows up on your iPad, with no export and no import</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={WifiOff} title={<Trans>Works after days offline</Trans>}>
                    <Trans>Budgie keeps working without a connection and syncs your changes as soon as iCloud is reachable</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ShieldCheck} title={<Trans>Encrypted before it leaves</Trans>}>
                    <Trans>
                        Your financial data is encrypted on your device before upload. With Apple&apos;s Advanced Data Protection it is
                        end-to-end encrypted in iCloud
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Mobile} title={<Trans>A new phone is not a fresh start</Trans>}>
                    <Trans>Sign in to the same Apple ID on the new iPhone and your data comes back through your own iCloud</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Sync is on by default once you are signed in to iCloud, and you can turn it off in Settings</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Settings shows when your data last synced, or why syncing stopped</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>A Try again row restarts sync straight away when something goes wrong</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Restore from iCloud is available in Settings</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item title={<Trans>When iCloud sync stops, Budgie says why</Trans>}>
                    <p>
                        <Trans>
                            Under Sync across devices, Settings shows when your data last synced. If syncing stops, it names the reason and
                            tells you what to do next.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            No internet connection, iCloud being busy, an Apple Account that needs attention, a full iCloud storage or
                            changes that could not be uploaded each get their own message. Your data stays safe on the device while sync is
                            paused.
                        </Trans>
                    </p>
                    <p>
                        <Trans>Tap Try again to restart sync immediately instead of waiting for the next time you open Budgie.</Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item title={<Trans>iPhone and iPad only, Android uses files</Trans>}>
                    <p>
                        <Trans>
                            iCloud sync and backup are for iOS. On Android there is no automatic sync, so you export a backup file whenever
                            you like and keep it wherever you choose.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            You can also share chosen accounts and budgets with family through iCloud. That has its own page: Family
                            sharing.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    question={<Trans>Do I need a Budgie account to sync?</Trans>}
                    answer={
                        <Trans>
                            No. Budgie has no accounts and no server that holds your transactions. Your devices sync through the iCloud you
                            are already signed in to.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Is my data encrypted?</Trans>}
                    answer={
                        <Trans>
                            Your financial data is encrypted on your device before it is uploaded, so it is encrypted in iCloud. If you turn
                            on Apple&apos;s Advanced Data Protection, it is end-to-end encrypted there too.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>What happens if I am offline for days?</Trans>}
                    answer={
                        <Trans>
                            Nothing breaks. Budgie works fully offline and your devices catch up automatically once iCloud is reachable
                            again.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>How do I move to a new iPhone?</Trans>}
                    answer={
                        <Trans>
                            Sign in to the same Apple ID on the new phone and open Budgie. Your data syncs back through your own iCloud. If
                            you have a backup file, you can restore from that instead.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>How do I turn it off?</Trans>}
                    answer={
                        <Trans>
                            Switch off Sync across devices in Settings. You can still export a backup file and store it in iCloud Drive,
                            Google Drive or Dropbox yourself. Without a synced copy or a backup file, the data on a lost phone is gone.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Does it work on Android?</Trans>}
                    answer={
                        <Trans>
                            No. iCloud sync is iPhone and iPad only. On Android you export a backup file by hand and import it on the new
                            phone.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
