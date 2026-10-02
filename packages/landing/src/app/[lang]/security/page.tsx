/* eslint-disable max-lines-per-function -- SEO page keeps unique content inline instead of registry-driven */
import { msg } from '@lingui/core/macro';
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
import { buildPillarHubRouteMetadata } from '../../../feature/util/build-pillar-hub-route-metadata.util';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../i18n/init-lingui';

import { SECURITY_PILLAR_HUB_METADATA } from './metadata';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildPillarHubRouteMetadata(i18n, SECURITY_PILLAR_HUB_METADATA);
}

export default async function SecurityPillarHubPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    return (
        <PillarHubPageShell
            description={i18n._(SECURITY_PILLAR_HUB_METADATA.metaDescription)}
            homeLabel={i18n._(msg`Home`)}
            locale={lang}
            publishedAt={SECURITY_PILLAR_HUB_METADATA.publishedAt}
            slug={SECURITY_PILLAR_HUB_METADATA.slug}
            title={i18n._(SECURITY_PILLAR_HUB_METADATA.metaTitle)}
            updatedAt={SECURITY_PILLAR_HUB_METADATA.updatedAt}
        >
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
                        tagline={<Trans>The PIN unlocks the app and unlocks your data — no PIN, no readable database.</Trans>}
                        title={<Trans>PIN App Lock — Locks With the Encryption Key</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/biometric-authentication`}
                        index={1}
                        tagline={<Trans>Biometric unlock hands Budgie only a yes or no — your PIN stays the key.</Trans>}
                        title={<Trans>Face ID / Touch ID Authentication</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/screenshot-protection`}
                        index={2}
                        tagline={<Trans>Accidental shares stay private — balances blur in screenshots and the app switcher.</Trans>}
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
                            Set a PIN and Budgie encrypts your data on the device, with that PIN as the key itself. The PIN is the only key
                            and it never leaves your device. Remove the PIN and the file is rewritten unencrypted — private to the app
                            sandbox, but no longer protected.
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
                            If a PIN was set when you exported, yes — the backup is a copy of your already-encrypted data, so anyone with
                            your cloud account sees an unreadable file. Export with no PIN set and the copy is unencrypted. Budgie never
                            uploads anything itself; you choose where the file goes through the share sheet.
                        </Trans>
                    }
                    question={<Trans>Are my backups safe if someone accesses my cloud storage?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            No. Because Budgie stores all data locally and has no backend that receives financial information, there is no
                            server to breach. The entire attack surface is limited to your device.
                        </Trans>
                    }
                    question={<Trans>Does Budgie have any server-side security risks?</Trans>}
                />
            </FeaturePageFaqSection>
        </PillarHubPageShell>
    );
}
