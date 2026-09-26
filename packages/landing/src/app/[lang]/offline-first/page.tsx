/* eslint-disable max-lines, max-lines-per-function -- SEO page keeps unique content inline instead of registry-driven */
import { msg, t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeaturePageBenefitGridItem } from '../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageComparisonTable } from '../../../feature/component/feature-page-comparison-table/feature-page-comparison-table';
import { FeaturePageFaqItem } from '../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageProse } from '../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageSection } from '../../../feature/component/feature-page-section/feature-page-section';
import { FeatureStory } from '../../../feature/component/feature-story/feature-story';
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
                        <Trans>Local backup files you can restore without a server — encrypted whenever your PIN is set</Trans>
                    </PillarHubHeroBulletItem>
                </PillarHubHeroBulletList>
            </PillarHubHero>

            <PillarHubSection>
                <PillarHubFeatureGrid>
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/self-hosted-finance-app-mobile`}
                        index={0}
                        tagline={
                            <Trans>
                                Self-hosting promises privacy but ships a server you have to babysit. Budgie gives you the same data
                                ownership with zero ops — your phone is the server.
                            </Trans>
                        }
                        title={<Trans>Self-Hosted Finance App on Mobile — Without Running a Server</Trans>}
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
                        tagline={<Trans>One file. No account. Restore by picking it — encrypted if your PIN was set.</Trans>}
                        title={<Trans>Database Backup &amp; Restore</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/budget-planning`}
                        index={5}
                        tagline={
                            <Trans>
                                Monthly limits, a home-screen widget, and 80% / 100% alerts computed and deduplicated on your device.
                            </Trans>
                        }
                        title={<Trans>Budget Planning</Trans>}
                    />
                </PillarHubFeatureGrid>
            </PillarHubSection>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Turn the radio off, nothing changes</Trans>}>
                    <Trans>Three screens with nothing behind them — the list, the entry, and a Settings page with no account on it.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Airplane mode changes nothing</Trans>}>
                    <Trans>The full list renders with the radio off. No spinner, no retry.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie transaction list showing eighty-one transactions read straight from the on-device database`}
                    index={0}
                    locale={lang}
                    scene="offline-first-expense-tracker-1"
                    slug="offline-first-expense-tracker"
                >
                    <FeatureStory.Callout y={0.205}>
                        <Trans>81 transactions, no request</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.45}>
                        <Trans>The whole list, no spinner</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Saving is instant</Trans>}>
                    <Trans>The row lands and the balance updates before a network app finishes its request.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie new expense screen with the amount keypad, account row and confirm button`}
                    index={1}
                    locale={lang}
                    scene="expense-tracking-1"
                    slug="expense-tracking"
                >
                    <FeatureStory.Callout y={0.335}>
                        <Trans>Amount first, no form</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.884}>
                        <Trans>Writes straight to the device</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Nothing to sign into</Trans>}>
                    <Trans>No account row anywhere in Settings — because there is no account.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie settings screen with security, language, currency and default account rows and no sign-in row`}
                    index={2}
                    locale={lang}
                    scene="offline-first-expense-tracker-2"
                    slug="offline-first-expense-tracker"
                >
                    <FeatureStory.Callout y={0.17}>
                        <Trans>No cloud sync, no tracking</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.3}>
                        <Trans>A PIN, not a login</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why offline-first matters for an expense tracker</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Most budgeting apps push every swipe and balance to a remote server. That makes them fragile when the internet
                        drops, and risky when those servers leak. Budgie inverts the model: your database lives on your phone, encrypted
                        with your PIN once you set one, and that&apos;s the whole story. There is no backend reading your statements.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        You can log an expense at 30,000 feet, walk through a Tube tunnel, or work a week off-grid — Budgie just keeps
                        working. When you are back online, optional bank sync fills in the gaps you missed; manual edits are never blocked.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Works in airplane mode, tunnels, and rural areas — every feature, every time</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>No sign-up, no email, no account — install and start logging</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Your database is encrypted on the device once you set a PIN — that PIN is the key</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>No backend means no breach surface — there is nothing to leak</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Optional bank sync uses your own API tokens — never a third-party aggregator</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Cloud apps vs. Budgie</Trans>
                </FeaturePageHeading>
                <FeaturePageComparisonTable rivalLabel={<Trans>Cloud app</Trans>}>
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>Your device only</Trans>}
                        concern={<Trans>Data location</Trans>}
                        rival={<Trans>Vendor servers + Plaid</Trans>}
                    />
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>Yes, fully</Trans>}
                        concern={<Trans>Works offline</Trans>}
                        rival={<Trans>Read-only at best</Trans>}
                    />
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>No</Trans>}
                        concern={<Trans>Account required</Trans>}
                        rival={<Trans>Yes</Trans>}
                    />
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>None — no servers</Trans>}
                        concern={<Trans>Subpoena risk</Trans>}
                        rival={<Trans>Vendor can be compelled</Trans>}
                    />
                </FeaturePageComparisonTable>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Yes. The entire transaction entry flow — amount, category, tags, account — works fully offline. Your data is
                            written directly to the on-device database with no network call.
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
                <FeaturePageFaqItem
                    question={<Trans>Does Budgie work without internet?</Trans>}
                    answer={
                        <Trans>
                            Yes, fully. Every core feature — logging expenses, viewing analytics, managing categories — runs entirely on
                            your device. Internet is only used when you opt in to bank sync, AI model downloads, or exchange-rate updates.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What happens if I lose my phone?</Trans>}
                    answer={
                        <Trans>
                            Without a backup file, your data is gone — that&apos;s the privacy trade-off. Budgie exports a copy of the
                            database file — encrypted if your PIN was set — that you can save to iCloud Drive, Google Drive, or anywhere
                            else. Restoring it on a new device takes a few steps: pick the file, confirm the replace, enter that
                            backup&apos;s PIN, and let the app restart.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What&apos;s the catch with offline-first?</Trans>}
                    answer={
                        <Trans>
                            The trade-off is multi-device sync — there&apos;s no automatic sync via our servers because we don&apos;t have
                            any. Use a backup file copied through your own cloud storage if you need to move between devices.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </PillarHubPageShell>
    );
}
