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

import { OFFLINE_FIRST_PILLAR_HUB_METADATA } from './metadata';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildPillarHubRouteMetadata(i18n, OFFLINE_FIRST_PILLAR_HUB_METADATA);
}

export default async function OfflineFirstPillarHubPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    return (
        <PillarHubPageShell
            description={i18n._(OFFLINE_FIRST_PILLAR_HUB_METADATA.metaDescription)}
            homeLabel={i18n._(msg`Home`)}
            locale={lang}
            publishedAt={OFFLINE_FIRST_PILLAR_HUB_METADATA.publishedAt}
            slug={OFFLINE_FIRST_PILLAR_HUB_METADATA.slug}
            title={i18n._(OFFLINE_FIRST_PILLAR_HUB_METADATA.metaTitle)}
            updatedAt={OFFLINE_FIRST_PILLAR_HUB_METADATA.updatedAt}
        >
            <PillarHubHero
                breadcrumbs={<PillarHubBreadcrumbs current={i18n._(OFFLINE_FIRST_PILLAR_HUB_METADATA.title)} locale={lang} />}
                heading={<Trans>Offline Budget App — Track Expenses Without Internet</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Every transaction is stored locally. No Wi-Fi required to add expenses, view balances, or import bank data. Works
                        anywhere.
                    </Trans>
                }
            >
                <PillarHubHeroBulletList>
                    <PillarHubHeroBulletItem>
                        <Trans>Full expense tracking with zero internet dependency</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>Import bank CSVs and PDFs without a cloud connection</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>Multi-currency exchange rates cached locally for offline use</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>Analytics, charts, and reports work entirely on-device</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>Encrypted local backups you can restore without a server</Trans>
                    </PillarHubHeroBulletItem>
                </PillarHubHeroBulletList>
            </PillarHubHero>

            <PillarHubSection>
                <PillarHubFeatureGrid>
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/offline-first-expense-tracker`}
                        index={0}
                        tagline={<Trans>Every transaction lives on your device. No cloud account, no sign-up.</Trans>}
                        title={<Trans>Offline-First Expense Tracker</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/csv-import`}
                        index={1}
                        tagline={<Trans>Any bank, any column order — set it up once per source, then it&apos;s two taps from there.</Trans>}
                        title={<Trans>CSV Bank Statement Import</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/erste-bank-pdf-import`}
                        index={2}
                        tagline={<Trans>Classic and modern PDF formats — full statement import in seconds.</Trans>}
                        title={<Trans>Erste Bank PDF Import</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/multi-currency`}
                        index={3}
                        tagline={<Trans>Track in any currency. Sum in yours. Daily FX-rate refresh keeps the math fair.</Trans>}
                        title={<Trans>Multi-Currency Accounts With Live Rates</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/database-backup`}
                        index={4}
                        tagline={<Trans>One encrypted file. No account. Restore on any device in seconds.</Trans>}
                        title={<Trans>Database Backup &amp; Restore</Trans>}
                    />
                </PillarHubFeatureGrid>
            </PillarHubSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Yes. The entire transaction entry flow — amount, category, tags, account — works fully offline. Your data is
                            written directly to the on-device SQLite database with no network call.
                        </Trans>
                    }
                    question={<Trans>Can I add transactions without an internet connection?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Exchange rates are fetched and cached locally when you have connectivity. You can continue converting currencies
                            offline using the last-fetched rates, with a visible timestamp so you always know their age.
                        </Trans>
                    }
                    question={<Trans>How does multi-currency work offline?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            CSV and PDF files already on your device can be imported offline. Monobank sync requires a brief network call to
                            Monobank&apos;s API, but every other import source works locally.
                        </Trans>
                    }
                    question={<Trans>Can I import bank statements without Wi-Fi?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            All charts, category breakdowns, tag analytics, and net-worth calculations run against the local database. They
                            work identically whether you are connected or not.
                        </Trans>
                    }
                    question={<Trans>Will my analytics still work offline?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Nothing happens — your data is safe on-device. You can keep adding transactions, reviewing history, and running
                            reports with no interruption. Sync features like Monobank simply wait until you reconnect.
                        </Trans>
                    }
                    question={<Trans>What happens to my data if I lose internet for weeks?</Trans>}
                />
            </FeaturePageFaqSection>
        </PillarHubPageShell>
    );
}
