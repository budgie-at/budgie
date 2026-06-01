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

import { PRIVACY_PILLAR_HUB_METADATA } from './metadata';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildPillarHubRouteMetadata(i18n, PRIVACY_PILLAR_HUB_METADATA);
}

export default async function PrivacyPillarHubPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);
    const featureSlugs = [
        'offline-first-expense-tracker',
        'pin-app-lock',
        'biometric-authentication',
        'screenshot-protection',
        'data-export',
        'database-backup'
    ];

    return (
        <PillarHubPageShell
            description={i18n._(PRIVACY_PILLAR_HUB_METADATA.metaDescription)}
            homeLabel={i18n._(msg`Home`)}
            locale={lang}
            publishedAt={PRIVACY_PILLAR_HUB_METADATA.publishedAt}
            slug={PRIVACY_PILLAR_HUB_METADATA.slug}
            title={i18n._(PRIVACY_PILLAR_HUB_METADATA.metaTitle)}
            updatedAt={PRIVACY_PILLAR_HUB_METADATA.updatedAt}
        >
            <PillarHubHero
                breadcrumbs={<PillarHubBreadcrumbs current={i18n._(PRIVACY_PILLAR_HUB_METADATA.title)} locale={lang} />}
                heading={<Trans>Private Expense Tracker — On Your Device, Off the Cloud</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        No account. No aggregator. No telemetry. Six features that make Budgie the most private expense tracker on iOS and
                        Android.
                    </Trans>
                }
            >
                <PillarHubHeroBulletList>
                    <PillarHubHeroBulletItem>
                        <Trans>Encrypted SQLite on your device — no cloud copy ever</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>No account required to start tracking</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>Biometric and PIN locks before any transaction view</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>Screenshot blur on balance fields and app-switcher previews</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>Backups to your own iCloud Drive, Google Drive, or Dropbox</Trans>
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
                            No. Every transaction, category, and balance lives in an encrypted SQLite database on your device. Budgie has no
                            backend that receives financial data.
                        </Trans>
                    }
                    question={<Trans>Does Budgie send any financial data to a server?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            No account is required. You open the app and start tracking immediately. There is no sign-up screen, no email
                            address collected, and no session token ever sent to our servers.
                        </Trans>
                    }
                    question={<Trans>Do I need to create an account to use Budgie?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Backups go to your personal cloud storage — iCloud Drive on iOS, or Google Drive or Dropbox on Android. Budgie
                            never receives a copy; you own every byte.
                        </Trans>
                    }
                    question={<Trans>Where are my backups stored?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Budgie ships with zero third-party analytics or advertising SDKs. Crash reporting is opt-in and anonymized;
                            financial data is never included.
                        </Trans>
                    }
                    question={<Trans>Does Budgie use any analytics or crash-reporting SDKs?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Budgie uses SQLCipher-backed SQLite with AES-256 encryption. The encryption key is derived from your device
                            keychain and is never transmitted off the device.
                        </Trans>
                    }
                    question={<Trans>How is the on-device database encrypted?</Trans>}
                />
            </FeaturePageFaqSection>
        </PillarHubPageShell>
    );
}
