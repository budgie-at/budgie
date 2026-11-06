/* eslint-disable max-lines-per-function -- SEO page keeps unique content inline instead of registry-driven */
import { Trans } from '@lingui/react/macro';

import { FeaturePageFaqItem } from '../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { PillarHubBreadcrumbs } from '../../../feature/component/pillar-hub-breadcrumbs/pillar-hub-breadcrumbs';
import { PillarHubFeatureGrid } from '../../../feature/component/pillar-hub-feature-grid/pillar-hub-feature-grid';
import { PillarHubHeroBulletItem } from '../../../feature/component/pillar-hub-hero-bullet-item/pillar-hub-hero-bullet-item';
import { PillarHubHeroBulletList } from '../../../feature/component/pillar-hub-hero-bullet-list/pillar-hub-hero-bullet-list';
import { PillarHubHero } from '../../../feature/component/pillar-hub-hero/pillar-hub-hero';
import { PillarHubPageShell } from '../../../feature/component/pillar-hub-page-shell/pillar-hub-page-shell';
import { PillarHubSection } from '../../../feature/component/pillar-hub-section/pillar-hub-section';
import { createPillarHubGenerateMetadata } from '../../../feature/utils/create-pillar-hub-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../i18n/init-lingui';

import { SECURITY_PILLAR_HUB_METADATA } from './metadata';

export const generateMetadata = createPillarHubGenerateMetadata(SECURITY_PILLAR_HUB_METADATA);

export default async function SecurityPillarHubPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    return (
        <PillarHubPageShell lang={lang} meta={SECURITY_PILLAR_HUB_METADATA}>
            <PillarHubHero
                breadcrumbs={<PillarHubBreadcrumbs current={i18n._(SECURITY_PILLAR_HUB_METADATA.title)} locale={lang} />}
                heading={<Trans>Encrypted Budget App — Lock Down Your Financial Data</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        PIN, biometrics, screenshot protection, and on-device encryption the moment you set a PIN. Budgie secures your
                        financial data at every layer.
                    </Trans>
                }
            >
                <PillarHubHeroBulletList>
                    <PillarHubHeroBulletItem>
                        <Trans>Set a PIN and your data is encrypted on the device — unreadable without those digits</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>PIN lock enforced before any transaction or balance is visible</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>Face ID and fingerprint authentication on every supported device</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>Automatic screenshot blur hides balances in the iOS and Android app switcher</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>A backup copies the database as it is — encrypted if your PIN was set when you exported</Trans>
                    </PillarHubHeroBulletItem>
                </PillarHubHeroBulletList>
            </PillarHubHero>

            <PillarHubSection>
                <PillarHubFeatureGrid>
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/pin-app-lock`}
                        index={0}
                        tagline={
                            <Trans>
                                A 4-digit PIN guards the app, with a growing wait after wrong tries and optional fingerprint or face unlock.
                            </Trans>
                        }
                        title={<Trans>PIN App Lock — Nothing Opens Without Your PIN or Biometrics</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/biometric-authentication`}
                        index={1}
                        tagline={<Trans>Biometric unlock hands Budgie only a yes or no — your PIN stays the fallback.</Trans>}
                        title={<Trans>Face ID, Touch ID and Fingerprint Unlock</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/screenshot-protection`}
                        index={2}
                        tagline={
                            <Trans>
                                Ask your phone to block screen capture and hide amounts in the app switcher with one switch in Settings.
                            </Trans>
                        }
                        title={<Trans>Screenshot Protection — Hide Bank Balance from Previews</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/database-backup`}
                        index={3}
                        tagline={<Trans>One file. No account. Restore by picking it — encrypted if your PIN was set.</Trans>}
                        title={<Trans>Database Backup &amp; Restore</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/bank-integration-management`}
                        index={4}
                        tagline={<Trans>One credential per bank, shared by every account on it — so rotating a token is one edit.</Trans>}
                        title={<Trans>Bank Connections</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/binance-sync`}
                        index={5}
                        tagline={<Trans>Read-only API keys signed on your device. No custody, no trading, no withdrawals.</Trans>}
                        title={<Trans>Binance Sync</Trans>}
                    />
                </PillarHubFeatureGrid>
            </PillarHubSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Set a PIN and Budgie encrypts your data on the device, with that PIN as the key itself. That PIN never leaves
                            your device. The iCloud backup uses its own key and sync records are encrypted before upload, so both are
                            encrypted in iCloud and end-to-end encrypted with Advanced Data Protection. Remove the PIN and the local file is
                            rewritten unencrypted — private to the app sandbox, but no longer protected.
                        </Trans>
                    }
                    question={<Trans>How is the database encrypted?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Budgie&apos;s PIN and biometric lock gate every app launch. Even if the device is unlocked, no financial data is
                            visible until the correct PIN or biometric challenge is passed.
                        </Trans>
                    }
                    question={<Trans>What happens if someone picks up my unlocked phone?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            No. Screenshot protection automatically blurs all sensitive screens when the app moves to the background,
                            preventing balance exposure in the iOS and Android recent-apps view.
                        </Trans>
                    }
                    question={<Trans>Can someone see my balance in the app switcher?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            The automatic iCloud backup and sync records are encrypted in iCloud, and end-to-end encrypted when you turn on
                            Apple&apos;s Advanced Data Protection; their metadata — backup date, device name and model, app version, and for
                            sharing the family members you invite — is visible to Apple. A manual export is a copy of your already-encrypted
                            data if a PIN was set, and unencrypted if not. Budgie runs no server of its own and never receives a copy.
                        </Trans>
                    }
                    question={<Trans>Are my backups safe if someone accesses my cloud storage?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            No. Budgie runs no server of its own, so there is no Budgie backend to breach. On iOS the encrypted backup and
                            sync records sit in your own iCloud, protected by Apple&apos;s account security and, with Advanced Data
                            Protection on, end-to-end encrypted.
                        </Trans>
                    }
                    question={<Trans>Does Budgie have any server-side security risks?</Trans>}
                />
            </FeaturePageFaqSection>
        </PillarHubPageShell>
    );
}
