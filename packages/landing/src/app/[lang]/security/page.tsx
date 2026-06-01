/* eslint-disable max-lines-per-function -- SEO page keeps unique content inline instead of registry-driven */
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeaturePageFaqItem } from '../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { PillarHubBreadcrumbs } from '../../../feature/component/pillar-hub-breadcrumbs/pillar-hub-breadcrumbs';
import { PillarHubFeatureGrid } from '../../../feature/component/pillar-hub-feature-grid/pillar-hub-feature-grid';
import { PillarHubHero } from '../../../feature/component/pillar-hub-hero/pillar-hub-hero';
import { PillarHubHeroBulletItem } from '../../../feature/component/pillar-hub-hero-bullet-item/pillar-hub-hero-bullet-item';
import { PillarHubHeroBulletList } from '../../../feature/component/pillar-hub-hero-bullet-list/pillar-hub-hero-bullet-list';
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
    const featureSlugs = ['pin-app-lock', 'biometric-authentication', 'screenshot-protection', 'database-backup'];

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
                        PIN, biometrics, screenshot protection, and AES-256 encrypted storage. Budgie secures your financial data at every
                        layer.
                    </Trans>
                }
            >
                <PillarHubHeroBulletList>
                    <PillarHubHeroBulletItem>
                        <Trans>AES-256 encrypted SQLite — your database is unreadable without your key</Trans>
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
                        <Trans>Backups are encrypted before leaving your device — the key stays with you</Trans>
                    </PillarHubHeroBulletItem>
                </PillarHubHeroBulletList>
            </PillarHubHero>

            <PillarHubSection>
                <PillarHubFeatureGrid locale={lang} slugs={featureSlugs} />
            </PillarHubSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Budgie stores all financial data in an SQLCipher-backed SQLite database encrypted with AES-256. The encryption
                            key is derived from your device keychain and never transmitted off the device.
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
                            Yes. Backups are encrypted on your device before upload using your device-derived key. Anyone with access to
                            your iCloud Drive or Google Drive would only see an encrypted blob — not your financial data.
                        </Trans>
                    }
                    question={<Trans>Are my encrypted backups safe if someone accesses my cloud storage?</Trans>}
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
