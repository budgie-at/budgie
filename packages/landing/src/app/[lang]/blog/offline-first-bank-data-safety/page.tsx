/* eslint-disable max-lines, max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import { isDefined } from '@rnw-community/shared';

import { BlogArticleContent } from '../../../../blog/component/blog-article-content/blog-article-content';
import { BlogArticleCta } from '../../../../blog/component/blog-article-cta/blog-article-cta';
import { BlogArticleHeading } from '../../../../blog/component/blog-article-heading/blog-article-heading';
import { BlogArticleHero } from '../../../../blog/component/blog-article-hero/blog-article-hero';
import { BlogArticleList } from '../../../../blog/component/blog-article-list/blog-article-list';
import { BlogArticleListItem } from '../../../../blog/component/blog-article-list-item/blog-article-list-item';
import { BlogArticleMeta } from '../../../../blog/component/blog-article-meta/blog-article-meta';
import { BlogArticleProse } from '../../../../blog/component/blog-article-prose/blog-article-prose';
import { BlogArticleSection } from '../../../../blog/component/blog-article-section/blog-article-section';
import { BlogArticleSubheading } from '../../../../blog/component/blog-article-subheading/blog-article-subheading';
import { BlogBreadcrumbCurrent } from '../../../../blog/component/blog-breadcrumb-current/blog-breadcrumb-current';
import { BlogBreadcrumbLink } from '../../../../blog/component/blog-breadcrumb-link/blog-breadcrumb-link';
import { BlogBreadcrumbs } from '../../../../blog/component/blog-breadcrumbs/blog-breadcrumbs';
import { BlogFaqItem } from '../../../../blog/component/blog-faq-item/blog-faq-item';
import { BlogFaqSection } from '../../../../blog/component/blog-faq-section/blog-faq-section';
import { BlogPostingJsonLd } from '../../../../blog/component/blog-posting-json-ld/blog-posting-json-ld';
import { RelatedArticles } from '../../../../blog/component/related-articles/related-articles';
import { ARTICLE_REGISTRY } from '../../../../blog/constant/article-registry.constant';
import { buildBlogArticleMetadata } from '../../../../blog/util/build-blog-article-metadata.util';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FEATURE_REGISTRY } from '../../../../feature/constant/feature-registry.constant';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';
import { Badge } from '../../../../ui/badge';

import type { Metadata } from 'next';

const SLUG = 'offline-first-bank-data-safety';
const DATE = '2026-05-07';
// eslint-disable-next-line lingui/no-unlocalized-strings
const AUTHOR = 'Budgie Team';
const IMAGE = '/images/design-mode/ai-budgeting-app-4x.jpg';
const READING_TIME = 10;

const RELATED_SLUGS = ['cloud-budgeting-privacy-risks', 'offline-first-privacy-financial-app'] as const;

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildBlogArticleMetadata({
        author: AUTHOR,
        date: DATE,
        description: t(
            i18n
        )`Financial aggregators centralise millions of bank credentials in one place — a magnet for attackers. Offline-first architecture eliminates the target. Here is how Budgie connects to banks without handing your credentials to a third party.`,
        image: IMAGE,
        keywords: t(i18n)`offline-first finance, bank data safety, Plaid alternative, no bank login budget app`,
        locale: lang,
        slug: SLUG,
        title: t(i18n)`Bank Data Safety: Why Offline-First Is the Only Honest Answer`
    });
}

export default async function OfflineFirstBankDataSafetyPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const articleEntry = ARTICLE_REGISTRY.find(item => item.slug === SLUG);
    const relatedFeatures =
        articleEntry?.relatedFeatureSlugs.map(slug => FEATURE_REGISTRY.find(feature => feature.slug === slug)).filter(isDefined) ?? [];

    return (
        <main className="flex-1">
            <BlogPostingJsonLd
                author={AUTHOR}
                blogLabel={t(i18n)`Blog`}
                date={DATE}
                description={t(
                    i18n
                )`Financial aggregators centralise millions of bank credentials in one place — a magnet for attackers. Offline-first architecture eliminates the target. Here is how Budgie connects to banks without handing your credentials to a third party.`}
                homeLabel={t(i18n)`Home`}
                image={IMAGE}
                keywords={t(i18n)`offline-first finance, bank data safety, Plaid alternative, no bank login budget app`}
                locale={lang}
                slug={SLUG}
                title={t(i18n)`Bank Data Safety: Why Offline-First Is the Only Honest Answer`}
            />

            <BlogArticleHero image={IMAGE} imageAlt={t(i18n)`Offline-first architecture for bank data safety`}>
                <Link
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                    href={`/${lang}/blog`}
                >
                    <Trans>← Back to Blog</Trans>
                </Link>

                <BlogBreadcrumbs>
                    <BlogBreadcrumbLink href={`/${lang}`} position={1}>
                        <Trans>Home</Trans>
                    </BlogBreadcrumbLink>
                    <BlogBreadcrumbLink href={`/${lang}/blog`} position={2}>
                        <Trans>Blog</Trans>
                    </BlogBreadcrumbLink>
                    <BlogBreadcrumbCurrent position={3}>
                        <Trans>Bank Data Safety: Why Offline-First Is the Only Honest Answer</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>Bank Data Safety: Why Offline-First Is the Only Honest Answer</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>
                        Financial aggregators centralise millions of bank credentials in one place — a magnet for attackers.
                        Offline-first architecture eliminates the target. Here is how Budgie connects to banks without handing your
                        credentials to a third party.
                    </Trans>
                </p>

                <BlogArticleMeta
                    author={AUTHOR}
                    date={DATE}
                    locale={lang}
                    readingTimeMinutes={READING_TIME}
                    tags={
                        <>
                            <Badge variant="secondary">
                                <Trans>bank data safety</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>offline-first</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>privacy</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>aggregators</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>security</Trans>
                            </Badge>
                        </>
                    }
                />
            </BlogArticleHero>

            <BlogArticleContent>
                <BlogArticleSection>
                    <BlogArticleProse>
                        <Trans>
                            Most personal finance apps that offer bank synchronization rely on a financial data aggregator to make it work.
                            The aggregator sits between you and your bank, collects your credentials or OAuth tokens, and feeds transaction
                            data back to the app. This pattern is so common that many users assume it is the only way automatic bank sync
                            can work.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            It is not. And the aggregator pattern carries risks that are rarely disclosed clearly to users. This article
                            explains what aggregators do, why mass aggregation creates a high-value breach target, and how an offline-first
                            architecture provides a structurally safer alternative.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>The Aggregator Pattern: What Plaid Does and What It Sees</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Plaid is a financial-data aggregator that acts as an intermediary between consumer finance apps and banks. When
                            you connect a bank account through an app that uses Plaid, here is what happens at the data layer:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Credential collection</strong> — For banks that do not support direct OAuth, Plaid historically
                                used screen-scraping, which required your actual username and password. Many integrations have migrated to
                                OAuth tokens, but the credential handling still flows through Plaid infrastructure.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Transaction mirroring</strong> — Plaid pulls your transaction stream from the bank and stores it.
                                The aggregator holds a copy of your financial history on its servers, separate from the app you are
                                actually using.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Data sharing</strong> — Plaid data can be shared with other Plaid-connected apps you have
                                previously authorized, lenders, credit bureaus, and partners under terms that users rarely read in full.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Retention</strong> — Transaction data is retained beyond the active period of any individual app
                                connection. Deleting the app does not automatically delete the data from the aggregator.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            This means that when you use any budgeting app backed by a major aggregator, your bank data exists in at least
                            three places: your bank, the app, and the aggregator. Each is an independent breach surface.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Why Mass Aggregation Is a High-Value Breach Target</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            A financial data aggregator that services millions of users holds credentials or access tokens for millions of
                            bank accounts in one system. From an attacker perspective, this is a far more attractive target than any
                            individual bank, because:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Single point of entry</strong> — Compromising one system yields access to credentials spanning
                                hundreds of different banks and financial institutions. Attackers do not need to target each bank
                                individually.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Concentrated transaction history</strong> — Aggregators hold not just credentials but also years
                                of normalized transaction history. This data is valuable for identity fraud, account takeover, and social
                                engineering attacks.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Third-party security posture</strong> — A major aggregator security posture is determined by that
                                company, not by your bank. Your bank may have excellent security practices, but your data exposure now
                                depends on a third party you did not explicitly choose.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            This risk is not theoretical. Major financial data aggregators and fintech intermediaries have experienced
                            significant security incidents over the years, exposing consumer banking credentials, account numbers, and
                            transaction history. Each incident affected users of multiple apps simultaneously, because the breach was at
                            the aggregator layer rather than any individual application.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Offline-First as the Architectural Answer</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            An offline-first architecture addresses aggregator risk at the structural level rather than through policy
                            promises. When your financial data is stored on your device and bank sync happens directly — without an
                            intermediary — the aggregator attack surface does not exist.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>What Changes Architecturally</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>No credential escrow</strong> — Your bank credentials or OAuth tokens are stored only on your
                                device, encrypted at rest. No third-party server holds a copy.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Direct bank communication</strong> — When sync runs, your device communicates directly with your
                                bank API. The transaction data flows from bank to device without passing through an intermediary server.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>No aggregator copy of your history</strong> — Because sync is direct, there is no second copy of
                                your transaction stream on an aggregator server. The only copies are at your bank and on your device.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Breach impact is isolated</strong> — If your device is compromised, the exposure is limited to
                                your accounts. An aggregator breach can expose every user simultaneously.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Direct API Tokens vs Aggregator OAuth</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Many banks now offer official API programs with scoped OAuth tokens. These tokens grant read-only access to
                            transaction history without exposing login credentials. When used in an offline-first app, this is the most
                            secure form of automated bank sync available:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Scoped permissions</strong> — The token grants access only to transaction data. It cannot
                                initiate transfers, change account details, or access other banking services.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Revocable</strong> — You can revoke the token from your bank portal at any time, immediately
                                terminating access without changing your password.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>No credential exposure</strong> — The token is generated by your bank, not derived from your
                                password. Even if the token is intercepted, your login credentials remain safe.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Stored locally</strong> — In an offline-first app, the token lives on your device, not on an
                                aggregator server. Revoking it from your bank also removes the only remaining access path.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            Aggregator OAuth, by contrast, routes your bank authorization through the aggregator platform. The resulting
                            token is held by the aggregator, not by the app or your device. You are trusting the aggregator to use it
                            responsibly and to secure it adequately.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>PDF, Excel, and CSV Imports as the Universal Fallback</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Not every bank offers an API program, and not every bank is supported by a given direct-sync integration.
                            For these cases, manual statement import is the privacy-preserving fallback — and it is more practical than
                            most people expect.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Why Manual Import Is Underrated</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Universal compatibility</strong> — Every bank that has ever existed can produce a statement.
                                CSV and PDF exports work with every financial institution on the planet, with no API access required.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>No ongoing credential exposure</strong> — You download a statement from your bank website using
                                your normal login, then import the file. There are no tokens, no saved credentials, and no persistent
                                connection to manage.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Predictable frequency</strong> — Most users reconcile their accounts weekly or monthly. Manual
                                statement import fits naturally into this cadence without requiring always-on connectivity.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Audit trail control</strong> — You decide exactly which time periods to import. There is no
                                background sync pulling in data without your explicit action.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>How Budgie Implements This End to End</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Budgie supports both direct bank sync and manual import, with a consistent commitment to keeping your data
                            on your device at every stage.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Direct Sync</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            For supported banks, Budgie connects directly from your device to the bank API using OAuth tokens stored in
                            the encrypted local database. The sync runs on your device; Budgie servers are not involved in the data flow.
                            Transaction data is written directly to the local SQLite database.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>CSV and PDF Import</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Budgie CSV and PDF import parses statement files on your device. No file content is uploaded to any server
                            during import. The parser runs locally, extracts transactions, and writes them to the local database.
                            Deduplication ensures that importing overlapping date ranges does not create duplicate records.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Encrypted Local Storage</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Whether data arrives via direct sync or manual import, it is stored in the same AES-256 encrypted SQLite
                            database. The database is protected by your device PIN, biometric authentication, or a dedicated app lock.
                            No transaction data is stored on Budgie servers at any point.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Encrypted Backup</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            When you create a backup, the encrypted database file is exported to your chosen destination — iCloud,
                            Google Drive, a local network share, or a USB-connected device. Budgie does not receive or store the backup.
                            Restoration reads the file from the same destination and decrypts it locally.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Frequently Asked Questions</Trans>
                    </BlogArticleHeading>

                    <BlogFaqSection>
                        <BlogFaqItem question={<Trans>Does Budgie use Plaid for bank sync?</Trans>}>
                            <Trans>
                                No. Budgie bank sync connects directly from your device to supported bank APIs without routing through a
                                financial aggregator. For banks not yet supported by direct sync, CSV and PDF import provides full
                                compatibility without any third-party credential handling.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Is CSV import really secure enough for ongoing use?</Trans>}>
                            <Trans>
                                Yes, for most users. Manual import aligns naturally with how people actually review their finances —
                                weekly or monthly. The security advantage is significant: there are no stored credentials, no persistent
                                connections, and no third-party services involved. Many security-conscious users prefer this model
                                precisely because it is explicit and auditable.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>What if my bank requires an aggregator for the app I currently use?</Trans>}>
                            <Trans>
                                Switching to Budgie CSV import eliminates the aggregator entirely. Download your statement from your bank
                                website as you normally would and import it into Budgie. You gain full transaction history without any
                                ongoing credential exposure to a third party.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>How does Budgie handle OAuth tokens for direct sync?</Trans>}>
                            <Trans>
                                OAuth tokens for direct bank sync are stored in the encrypted local database on your device alongside
                                your transaction data. They are protected by the same AES-256 encryption and device authentication as
                                your financial records. Revoking a token from your bank portal immediately terminates all sync access
                                without requiring any action inside Budgie.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Can I verify that Budgie does not send my bank data to a server?</Trans>}>
                            <Trans>
                                Yes. Budgie is open source. You can review the bank sync and import code to confirm that no outbound
                                calls send transaction data to Budgie servers. The network requests during sync go directly from your
                                device to your bank API endpoint.
                            </Trans>
                        </BlogFaqItem>
                    </BlogFaqSection>
                </BlogArticleSection>
            </BlogArticleContent>

            <BlogArticleCta locale={lang} />

            <RelatedArticles locale={lang} slugs={RELATED_SLUGS} />

            <FeaturePageRelated features={relatedFeatures} locale={lang} />
        </main>
    );
}
