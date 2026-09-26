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

import { BANK_SYNC_PILLAR_HUB_METADATA } from './metadata';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildPillarHubRouteMetadata(i18n, BANK_SYNC_PILLAR_HUB_METADATA);
}

export default async function BankSyncPillarHubPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    return (
        <PillarHubPageShell
            description={i18n._(BANK_SYNC_PILLAR_HUB_METADATA.metaDescription)}
            homeLabel={i18n._(msg`Home`)}
            locale={lang}
            publishedAt={BANK_SYNC_PILLAR_HUB_METADATA.publishedAt}
            slug={BANK_SYNC_PILLAR_HUB_METADATA.slug}
            title={i18n._(BANK_SYNC_PILLAR_HUB_METADATA.metaTitle)}
            updatedAt={BANK_SYNC_PILLAR_HUB_METADATA.updatedAt}
        >
            <PillarHubHero
                breadcrumbs={<PillarHubBreadcrumbs current={i18n._(BANK_SYNC_PILLAR_HUB_METADATA.title)} locale={lang} />}
                heading={<Trans>Bank Sync & Statement Import — Bring Your Bank Data In</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Connect a supported bank for automatic sync, or bring in statements from PDF, XLSX, or CSV. Budgie catches duplicate
                        imports, pairs up transfers on its own, and lets you fix a bad sync without starting over.
                    </Trans>
                }
            >
                <PillarHubHeroBulletList>
                    <PillarHubHeroBulletItem>
                        <Trans>Connect Monobank once and new transactions, jars, and FX rates arrive on their own</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>No live connection? Import statements from Erste PDF, PrivatBank XLSX, or any bank&apos;s CSV</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>Sync repairs find duplicate imports and pair your own-card transfers automatically</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>A re-sync window backfills recent history without touching your manual edits</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>Read-only Binance sync brings crypto balances into the same view — no trading, no withdrawals</Trans>
                    </PillarHubHeroBulletItem>
                </PillarHubHeroBulletList>
            </PillarHubHero>

            <PillarHubSection>
                <PillarHubFeatureGrid>
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/monobank-sync`}
                        index={0}
                        tagline={<Trans>Direct API. No aggregator. Full transaction history to your device.</Trans>}
                        title={<Trans>Monobank Expense Tracker — Direct API Sync, No Plaid</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/bank-integration-management`}
                        index={1}
                        tagline={<Trans>Cards, jars, and deposits share a single connection, so a token change is a one-time job.</Trans>}
                        title={<Trans>Bank Connections — One Credential, Many Accounts</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/bank-resync-window`}
                        index={2}
                        tagline={<Trans>Re-pull a slice. Keep your edits. No nuke-from-orbit.</Trans>}
                        title={<Trans>Windowed Bank Re-sync</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/sync-data-repairs`}
                        index={3}
                        tagline={
                            <Trans>Finds duplicate imports and pairs your own-card transfers that arrived as two separate rows.</Trans>
                        }
                        title={<Trans>Sync Data Repairs</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/transfer-pair-detection`}
                        index={4}
                        tagline={
                            <Trans>
                                Budgie consolidates obvious transfers and merchant refunds automatically, then leaves ambiguous matches for
                                review.
                            </Trans>
                        }
                        title={<Trans>Smart Transfer and Refund Consolidation</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/csv-import`}
                        index={5}
                        tagline={<Trans>Any bank, any column order — map it on one screen or start from a built-in preset.</Trans>}
                        title={<Trans>CSV Bank Statement Import</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/erste-bank-pdf-import`}
                        index={6}
                        tagline={<Trans>Classic and modern PDF formats — full statement import in seconds.</Trans>}
                        title={<Trans>Erste Bank PDF Import</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/privatbank-import`}
                        index={7}
                        tagline={<Trans>One-time import, MCC-mapped — long-press an account card to jump to the picker.</Trans>}
                        title={<Trans>PrivatBank XLSX Import</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/binance-sync`}
                        index={8}
                        tagline={
                            <Trans>
                                Spot, Funding, and Simple Earn balances plus P2P, trades, and rewards — signed with a read-only API key.
                            </Trans>
                        }
                        title={<Trans>Binance Sync — Read-Only Keys, Real Balances</Trans>}
                    />
                </PillarHubFeatureGrid>
            </PillarHubSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Monobank and Binance connect with a personal API key for live, automatic sync. Erste and PrivatBank statements
                            import directly from PDF or XLSX, and any other bank works through flexible CSV import with column mapping or a
                            built-in preset.
                        </Trans>
                    }
                    question={<Trans>Which banks does Budgie support?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            No. Live sync uses a personal API key you generate yourself, scoped to reading your data, never your account
                            password. Statement imports need no credentials at all — you just pick the exported file.
                        </Trans>
                    }
                    question={<Trans>Do I need to give Budgie my bank login?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Nothing is lost. Each connection commits what it fetched to your local database as it completes, and every row
                            carries a source id, so the next sync picks up where it left off without creating duplicates.
                        </Trans>
                    }
                    question={<Trans>What happens if a sync fails partway through?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Yes. Each account picks the method that fits its bank — live sync, a one-time statement import, or manual entry
                            — and they all sit side by side in the same budget. Sync data repairs and transfer detection run across every
                            account regardless of how its transactions arrived.
                        </Trans>
                    }
                    question={<Trans>Can I use bank sync and CSV import together?</Trans>}
                />
            </FeaturePageFaqSection>
        </PillarHubPageShell>
    );
}
