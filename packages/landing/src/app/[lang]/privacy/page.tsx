/* eslint-disable max-lines, max-lines-per-function -- SEO page keeps unique content inline instead of registry-driven */
import { msg, t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeaturePageCategoryComparison } from '../../../feature/component/feature-page-category-comparison/feature-page-category-comparison';
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
                        <Trans>Your data stays on your device, encrypted with your PIN once you set one — no cloud copy ever</Trans>
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
                <PillarHubFeatureGrid>
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/monobank-sync`}
                        index={0}
                        tagline={<Trans>Direct API. No aggregator. Full transaction history to your device.</Trans>}
                        title={<Trans>Monobank Expense Tracker — Direct API Sync, No Plaid</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/pin-app-lock`}
                        index={1}
                        tagline={<Trans>The PIN unlocks the app and unlocks your data — no PIN, no readable database.</Trans>}
                        title={<Trans>PIN App Lock — Locks With the Encryption Key</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/biometric-authentication`}
                        index={2}
                        tagline={<Trans>Biometric unlock hands Budgie only a yes or no — your PIN stays the key.</Trans>}
                        title={<Trans>Face ID / Touch ID Authentication</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/screenshot-protection`}
                        index={3}
                        tagline={<Trans>Accidental shares stay private — balances blur in screenshots and the app switcher.</Trans>}
                        title={<Trans>Screenshot Protection — Hide Bank Balance from Previews</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/data-export`}
                        index={4}
                        tagline={<Trans>CSV for spreadsheets. A full database backup for restore. Both yours, never ours.</Trans>}
                        title={<Trans>Export Every Transaction You&apos;ve Logged</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/database-backup`}
                        index={5}
                        tagline={<Trans>One file. No account. Restore by picking it — encrypted if your PIN was set.</Trans>}
                        title={<Trans>Database Backup &amp; Restore</Trans>}
                    />
                </PillarHubFeatureGrid>
            </PillarHubSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Private Budget App — A Cloud-Free Alternative</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Cloud-based personal finance apps mirror every transaction to their servers. Budgie keeps your ledger on your
                        device. No account, no aggregator, no copy on somebody else&apos;s server.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageCategoryComparison categoryLabel={<Trans>Cloud-based PFM apps</Trans>}>
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>On your phone, encrypted once you set a PIN</Trans>}
                        competitorValue={<Trans>Vendor&apos;s cloud + aggregator</Trans>}
                        label={<Trans>Where transactions live</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>No</Trans>}
                        competitorValue={<Trans>Yes — email + password</Trans>}
                        label={<Trans>Account required</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Optional, direct API tokens</Trans>}
                        competitorValue={<Trans>Required, via aggregator</Trans>}
                        label={<Trans>Bank login</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>None — there is no paid tier</Trans>}
                        competitorValue={<Trans>Monthly recurring</Trans>}
                        label={<Trans>Subscription</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>On your phone</Trans>}
                        competitorValue={<Trans>In the vendor cloud</Trans>}
                        label={<Trans>AI runs</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Yes</Trans>}
                        competitorValue={<Trans>No</Trans>}
                        label={<Trans>Public source</Trans>}
                    />
                </FeaturePageCategoryComparison>
            </FeaturePageSection>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Where a cloud-free budget app keeps your money data</Trans>}>
                    <Trans>
                        Budgie&apos;s Settings screen opens on a Privacy card, and the Security group sits right under it. Between them they
                        show the whole arrangement: one local database, no sign-in, and a lock you turn on yourself.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Point index={0}>
                    <Trans>
                        Privacy is the first group in Settings. Every account, transaction and category lives in a single file on the phone
                        — there is no vendor database holding a second copy.
                    </Trans>
                </FeatureStory.Point>

                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Settings screen with a Privacy card stating all financial data is stored locally on the device, above a Security group where App Lock is not yet enabled and Screenshot Protection is off`}
                    index={0}
                    locale={lang}
                    scene="private-budget-app-alternative-1"
                    slug="private-budget-app-alternative"
                >
                    <FeatureStory.Callout index={0} y={0.255}>
                        <Trans>Stored locally on your device</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.4}>
                        <Trans>App Lock, off by default</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Point index={1}>
                    <Trans>
                        Nothing on this screen asks who you are. There is no account, no email, no sign-in step — so there is no server-side
                        profile that a breach could expose.
                    </Trans>
                </FeatureStory.Point>
                <FeatureStory.Point index={2}>
                    <Trans>
                        App Lock is opt-in, and the PIN you set does double duty: it becomes the key the whole file is encrypted with. Until
                        you set one, the file is ordinary local storage — private to the app sandbox, but not encrypted.
                    </Trans>
                </FeatureStory.Point>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Budget App Without Bank Login — Direct API or Statement Import</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Aggregators sit between you and your bank, mirroring every transaction to their servers. Budgie talks to your bank
                        directly via tokens or imports statements you download yourself.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageCategoryComparison categoryLabel={<Trans>Aggregator-based PFM apps</Trans>}>
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Never shared</Trans>}
                        competitorValue={<Trans>Held by aggregator</Trans>}
                        label={<Trans>Bank credentials</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Direct API tokens or PDF/CSV</Trans>}
                        competitorValue={<Trans>OAuth via aggregator</Trans>}
                        label={<Trans>Sync method</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>None</Trans>}
                        competitorValue={<Trans>Third-party aggregator service</Trans>}
                        label={<Trans>Aggregator middleman</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Bank-level only</Trans>}
                        competitorValue={<Trans>Bank + aggregator + app</Trans>}
                        label={<Trans>Bank breach impact</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Yes (statement import)</Trans>}
                        competitorValue={<Trans>Often no</Trans>}
                        label={<Trans>Works with offline-only banks</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Manual or scheduled</Trans>}
                        competitorValue={<Trans>Aggregator&apos;s clock</Trans>}
                        label={<Trans>Sync interval</Trans>}
                    />
                </FeaturePageCategoryComparison>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            No. Every transaction, category, and balance lives in a database on your device, encrypted with your PIN once
                            you set one. Budgie has no backend that receives financial data.
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
                            Set a PIN and Budgie encrypts the database with that PIN as the key. The PIN is the only key and it never leaves
                            your device. Without a PIN the file is not encrypted, though it stays inside the app sandbox.
                        </Trans>
                    }
                    question={<Trans>How is the on-device database encrypted?</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>How is Budgie different from cloud-based PFM apps?</Trans>}
                    answer={
                        <Trans>
                            Cloud-based PFM apps mirror your transactions to their servers, share data with aggregators, and store your bank
                            credentials. Budgie does none of this — your ledger stays on your device, and setting a PIN encrypts that file.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How does bank sync work without an aggregator?</Trans>}
                    answer={
                        <Trans>
                            Budgie talks to Monobank&apos;s own API with a token you paste in, parses Erste PDF statements and PrivatBank
                            Excel exports on the device, and imports any other bank through generic CSV. No aggregator sits in between.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What about multi-device sync?</Trans>}
                    answer={
                        <Trans>
                            Export Database writes the whole database to one file and hands it to the system share sheet, so you choose
                            where it goes — iCloud Drive, Google Drive, Dropbox, a NAS. Budgie has no sync server and no integration with
                            any of them.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is the privacy claim verifiable?</Trans>}
                    answer={
                        <Trans>Yes — Budgie&apos;s source is public. Read the network code yourself: github.com/budgie-at/budgie.</Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What about third-party aggregators?</Trans>}
                    answer={
                        <Trans>
                            Aggregators sit between you and your bank, mirroring transactions to their servers. Budgie deliberately does not
                            use them.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is direct API more secure than OAuth?</Trans>}
                    answer={
                        <Trans>
                            Both can be secure when implemented correctly. The difference is the threat surface: direct tokens are
                            bank-to-you; aggregator OAuth adds a third party with your credentials and your transaction stream.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Which banks have direct API support?</Trans>}
                    answer={
                        <Trans>
                            Monobank today; we add direct integrations as banks publish stable APIs. For everything else, statement import
                            (PDF, CSV, Excel) covers the gap.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </PillarHubPageShell>
    );
}
