/* eslint-disable max-lines, max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

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
import { buildBlogArticleMetadata } from '../../../../blog/util/build-blog-article-metadata.util';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import type { Metadata } from 'next';

const SLUG = 'budgie-offline-financial-data';
const DATE = '2025-02-10';
// eslint-disable-next-line lingui/no-unlocalized-strings
const AUTHOR = 'Budgie Team';
const IMAGE = '/images/design-mode/ai-budgeting-app-4x.jpg';
const READING_TIME = 19;

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildBlogArticleMetadata({
        author: AUTHOR,
        date: DATE,
        description: t(i18n)`A technical deep-dive into Budgie's offline-first architecture, explaining how SQLite, AES-256 encryption, and device-to-device sync keep your financial data completely private.`,
        image: IMAGE,
        keywords: t(i18n)`offline expense tracker, private finance app, local budget app, offline budget app, financial data privacy, SQLite expense tracker, encrypted budget app`,
        locale: lang,
        slug: SLUG,
        title: t(i18n)`How Budgie Keeps Your Financial Data Off the Cloud`
    });
}

export default async function BudgieOfflineFinancialDataArticle(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const articleTags = [
                        <Trans key="privacy">privacy</Trans>,
                        <Trans key="security">security</Trans>,
                        <Trans key="architecture">architecture</Trans>,
                        <Trans key="encryption">encryption</Trans>,
                        <Trans key="open-source">open-source</Trans>,
                        <Trans key="offline-first">offline-first</Trans>
                    ];

    return (
        <main className="flex-1">
            <BlogPostingJsonLd
                author={AUTHOR}
                date={DATE}
                description={t(i18n)`A technical deep-dive into Budgie's offline-first architecture, explaining how SQLite, AES-256 encryption, and device-to-device sync keep your financial data completely private.`}
                image={IMAGE}
                keywords={t(i18n)`offline expense tracker, private finance app, local budget app, offline budget app, financial data privacy, SQLite expense tracker, encrypted budget app`}
                locale={lang}
                slug={SLUG}
                title={t(i18n)`How Budgie Keeps Your Financial Data Off the Cloud`}
            />

            <BlogArticleHero image={IMAGE} imageAlt={t(i18n)`How Budgie keeps your financial data off the cloud`}>
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
                        <Trans>How Budgie Keeps Your Financial Data Off the Cloud</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>How Budgie Keeps Your Financial Data Off the Cloud</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>
                        A technical deep-dive into Budgie’s offline-first architecture, explaining how SQLite, AES-256 encryption, and
                        device-to-device sync keep your financial data completely private.
                    </Trans>
                </p>

                <BlogArticleMeta
                    author={AUTHOR}
                    date={DATE}
                    locale={lang}
                    readingTimeMinutes={READING_TIME}
                    tags={articleTags}
                />
            </BlogArticleHero>

            <BlogArticleContent>
                <BlogArticleSection>
                    <BlogArticleProse>
                        <Trans>
                            When you open most expense tracking apps, something happens in the background that you might not notice: your
                            transaction data, account balances, and spending habits are uploaded to servers you do not control. These servers
                            might be located anywhere in the world, managed by teams you have never met, and protected by security practices
                            you cannot verify.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Budgie takes a fundamentally different approach.{' '}
                            <strong>Your financial data never leaves your device.</strong> This is not a marketing statement or a simplified
                            explanation of a more complex reality. It is a literal description of how the app works at the code level.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            In this article, we will walk through exactly how Budgie keeps your financial data off the cloud. We will cover
                            the database architecture, encryption implementation, sync mechanisms, and security practices that make this
                            possible. If you are evaluating Budgie and want to understand what you are trusting, this guide will give you the
                            complete technical picture.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>The Architecture: SQLite and Local-First Design</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            At the heart of Budgie is a local-first architecture built on SQLite, the most widely deployed database engine in
                            the world. SQLite runs on billions of devices and has been battle-tested for over two decades. It is the same
                            database that powers your browser history, your mobile contacts, and countless other applications that require
                            reliable local storage.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Why SQLite Over Cloud Databases</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Cloud-based expense trackers typically use databases like PostgreSQL, MySQL, or MongoDB running on remote servers.
                            When you add a transaction, it travels over the internet to a data center, gets processed, and then a confirmation
                            returns to your device. This architecture creates several problems:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Network dependency</strong>: You cannot access your data without an internet connection. Try adding an
                            expense while underground on the subway or in an area with poor coverage, and you are stuck.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Latency</strong>: Every operation requires a round trip to the server. Even with fast connections, this
                            adds noticeable delay to every action you take.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Data exposure</strong>: Your financial data exists on servers that could be breached, subpoenaed, or
                            accessed by employees with administrative privileges.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Service dependency</strong>: If the company shuts down, gets acquired, or experiences extended outages,
                            your access to your own financial history disappears.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            SQLite eliminates all of these problems. The database file lives on your device, operations happen in
                            microseconds, and your data remains under your physical control.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>How Data Storage Works in Budgie</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            When you create a transaction in Budgie, here is what happens at the technical level:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList ordered>
                        <BlogArticleListItem>
                            <Trans>The app validates the input using Zod schemas to ensure data integrity</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                The transaction is written to a SQLite database stored in your device’s secure app storage
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>The database uses Drizzle ORM for type-safe operations</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>The write completes locally with no network activity</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            There is no background sync silently uploading your data. There is no analytics event recording what you spent
                            money on. The operation begins and ends on your device.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            The SQLite database file is stored in a protected directory that only Budgie can access. On iOS, this is the
                            app’s sandboxed Documents directory. On Android, it is the internal app storage that other applications cannot
                            read.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>No Analytics, No Tracking, No Telemetry</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Many apps that claim to respect privacy still collect anonymized usage data, crash reports, or analytics events.
                            These data streams can reveal more than you might expect. Even without your name attached, patterns in your usage
                            can be identifying.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Budgie includes zero analytics SDKs. We do not use Firebase Analytics, Mixpanel, Amplitude, or any similar
                            service. We do not collect crash reports through third-party services. We do not record which features you use,
                            how often you open the app, or what categories you spend money in.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            This is not because we do not care about improving the product. We do. But we have chosen to gather feedback
                            through direct user conversations and open-source community input rather than surveillance infrastructure.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>End-to-End Encryption Explained</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Storing data locally is the first layer of protection. Encryption is the second. Even if someone gains physical
                            access to your device, your financial data should remain unreadable without your authorization.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>AES-256 Encryption at Rest</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Budgie encrypts your database using AES-256, the same encryption standard used by governments and financial
                            institutions worldwide. AES-256 has never been broken by any publicly known attack. A brute-force attempt to
                            crack a 256-bit key would require more energy than exists in the observable universe.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            When your database is encrypted, the file on disk appears as random binary data. Without the correct key, it is
                            computationally infeasible to extract any meaningful information.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>How Keys Are Managed Locally</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            The encryption key never leaves your device and never touches our servers because we do not have servers that
                            handle user data. Here is how key management works:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Key derivation</strong>: Your encryption key is derived from your device credentials using
                            industry-standard key derivation functions. This means the key is unique to your device and cannot be
                            reconstructed elsewhere.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Secure storage</strong>: The derived key is stored in platform-specific secure enclaves. On iOS, this is
                            the Keychain. On Android, it is the Android Keystore backed by hardware security modules when available.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Key isolation</strong>: Each device has its own encryption key. There is no master key that could decrypt
                            all user databases, because such a key does not exist.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Memory protection</strong>: Keys are held in memory only when needed for database operations and are
                            cleared when the app is backgrounded or closed.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            This architecture means that even if someone steals your device, they cannot read your financial data without also
                            compromising your device’s security (unlocking it with your biometrics or passcode).
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>What Encryption Protects Against</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>Database encryption protects your data in several scenarios:</Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Device theft</strong>: A thief cannot plug your phone into a computer and extract readable financial data.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Forensic analysis</strong>: Even with sophisticated forensic tools, the encrypted database cannot be
                            meaningfully analyzed without the key.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Backup exposure</strong>: If your device backup is compromised, the encrypted database within it remains
                            protected.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>App data extraction</strong>: On rooted or jailbroken devices where app sandboxing can be bypassed,
                            encryption still protects the data.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>What Happens When You Sync Between Devices</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            One of the most common questions about offline-first apps is: how do I get my data onto a new device? Budgie
                            handles this through device-to-device sync with no cloud intermediary.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Device-to-Device Sync Architecture</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            When you want to transfer your data to a new device, Budgie uses direct peer-to-peer communication. Here is the
                            process:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList ordered>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Discovery</strong>: Both devices discover each other on the local network or through a temporary relay
                                that sees only encrypted blobs
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Authentication</strong>: You confirm the transfer on both devices, usually by comparing a visual code
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Encrypted transfer</strong>: The database is transferred in its encrypted form
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Local decryption</strong>: The receiving device uses key exchange protocols to establish the ability to
                                decrypt the transferred data
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            The critical point is that at no point does readable financial data travel through any third-party infrastructure.
                            Even the temporary relay used for discovery when devices are not on the same network sees only encrypted data that
                            it cannot interpret.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Conflict Resolution Without Servers</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Traditional cloud sync relies on a central server to be the source of truth when conflicts arise. If you edit a
                            transaction on two devices, the server decides which version wins.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Budgie uses a different approach based on Conflict-free Replicated Data Types (CRDTs) and operational transforms.
                            Each change is recorded as an operation with a timestamp and device identifier. When syncing:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList ordered>
                        <BlogArticleListItem>
                            <Trans>Operations from both devices are exchanged</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>A deterministic merge algorithm combines the operations</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Both devices arrive at the same final state without needing a server to arbitrate</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            This means you can use Budgie on multiple devices that occasionally sync when they are on the same network, and
                            your data will eventually converge to a consistent state without data loss.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>The Tradeoff: Sync Convenience vs. Privacy</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            We will be direct about the tradeoffs. Cloud sync is more convenient. You do not need to be on the same network.
                            You do not need to initiate a sync manually. Changes propagate automatically in the background.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Budgie’s device-to-device sync requires more user involvement. You need to explicitly trigger sync when you want
                            data to transfer. Both devices need to be accessible, either on the same local network or both connected to the
                            internet for the relay-assisted handshake.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            We believe this tradeoff is worth it for financial data. The convenience of automatic cloud sync comes at the cost
                            of your data existing on servers you do not control. For many types of data, that tradeoff is acceptable. For your
                            complete financial history, we think local control is worth the extra steps.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Bank Connections Without Plaid</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Most expense tracking apps that offer bank synchronization use Plaid, Yodlee, or similar aggregation services.
                            These services work by collecting your bank credentials or OAuth tokens and then accessing your account on your
                            behalf. Your transaction history flows through their servers before reaching your app.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>Budgie takes a different approach to bank data import.</Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Manual Import: The Privacy-First Option</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            The most private way to get bank data into Budgie is manual import. Most banks allow you to download transaction
                            history in standard formats like CSV, OFX, or QIF. You download this file directly from your bank, and Budgie
                            imports it locally on your device.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>No third party ever sees your bank data. No credentials are shared with anyone. The process is:</Trans>
                    </BlogArticleProse>

                    <BlogArticleList ordered>
                        <BlogArticleListItem>
                            <Trans>Log into your bank directly in your browser</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Download your transaction history</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Import the file into Budgie</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Budgie parses and categorizes the transactions locally</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            The parsing and categorization happen entirely on your device. Budgie includes pattern recognition for common
                            transaction formats from major banks, and you can customize categorization rules that apply locally.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Why We Chose Privacy Over Convenience</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            We could have integrated Plaid. It would have been easier for us to implement and more convenient for users. One
                            button click and your transactions appear automatically.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>But that convenience comes with costs that are often invisible to users:</Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Data retention</strong>: Aggregation services retain your transaction history on their servers, sometimes
                            indefinitely.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Third-party access</strong>: Your bank data flows through infrastructure operated by companies whose
                            business model depends on data.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Credential exposure</strong>: Some services store your bank credentials, creating a high-value target for
                            attackers.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Regulatory risk</strong>: Your data becomes subject to the legal jurisdictions and requests wherever those
                            servers are located.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Manual import takes more effort, but it ensures that your bank data follows the same privacy guarantees as the
                            rest of Budgie: it never leaves your device, and no third party ever has access.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Future Considerations</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            We are exploring options for assisted bank import that would maintain privacy guarantees. This might include local
                            parsing of bank emails, integration with open banking APIs that use OAuth without credential sharing, or
                            partnerships with privacy-focused financial data providers that operate under strict data handling agreements.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Any future solution will maintain our core principle: your financial data remains on your device, encrypted, and
                            under your control.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Open Source: Verify Our Claims Yourself</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Everything we have described in this article can be verified by examining our source code. Budgie is open source,
                            and we believe this transparency is essential for any application that handles sensitive financial data.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Link to the Repository</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Our complete source code is available on GitHub. You can find it by visiting our open-source section where the
                            repository link is provided.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>The repository includes:</Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>The complete React Native application source</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Database schemas and migration files</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Encryption implementation details</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Sync protocol implementation</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Build scripts and CI configuration</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            There are no private repositories containing the “real” code that handles your data differently. What you see is
                            what runs on your device.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>How to Audit the Code</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>If you want to verify our privacy claims, here are the key areas to examine:</Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Network layer</strong>: Search for any HTTP clients, fetch calls, or socket connections. You will find
                            that network usage is limited to exchange rate fetching (which does not include any user data), optional
                            device-to-device sync (encrypted end-to-end), and app update checks (no user data transmitted).
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Database layer</strong>: Examine the Drizzle ORM schemas and repository classes. You can trace exactly how
                            data flows from user input to database storage, all locally.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Analytics and tracking</strong>: Search for any analytics SDK initialization. You will not find Firebase,
                            Amplitude, Mixpanel, or any similar integration.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Third-party SDKs</strong>: Review the dependency tree. We minimize external dependencies, and each one is
                            selected carefully to avoid privacy-invasive libraries.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            We welcome security researchers, privacy advocates, and technically curious users to examine our code. If you find
                            something that contradicts our privacy claims, we want to know about it.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Reproducible Builds</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            We are working toward fully reproducible builds, which would allow you to compile the source code yourself and
                            verify that the binary matches what is distributed through app stores. This is the gold standard for verifiable
                            software, and it is on our roadmap.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Security Practices and Transparency</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Beyond the architecture itself, how we develop and maintain Budgie matters for your security.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>No Third-Party SDKs with Tracking</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Every dependency in Budgie is evaluated for privacy implications before inclusion. We specifically avoid:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Analytics and crash reporting SDKs that collect user behavior data</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Advertising SDKs that build user profiles</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Social login SDKs that share data with platform providers</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Any SDK that requires network connectivity for basic functionality</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            This significantly limits our choices compared to developers who do not prioritize privacy. But it means you can
                            trust that opening Budgie is not silently reporting your activity to a dozen different data collection services.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Dependency Auditing</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Open source software depends on a chain of dependencies, and any link in that chain could introduce
                            vulnerabilities or privacy issues. Our security practices include:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Regular dependency audits</strong>: We use automated tools to scan for known vulnerabilities in our
                            dependency tree.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Minimal dependency philosophy</strong>: We prefer implementing functionality ourselves over adding
                            dependencies, reducing attack surface.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Source review for critical paths</strong>: Dependencies that touch encryption, database operations, or any
                            sensitive data paths are manually reviewed.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            <strong>Lock file integrity</strong>: Dependency versions are locked to prevent supply chain attacks through
                            compromised package updates.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Responsible Disclosure</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            If you discover a security vulnerability in Budgie, we want to work with you to fix it responsibly. Contact
                            information for security reports is available in our repository. We commit to:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Acknowledging receipt of vulnerability reports within 48 hours</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Providing regular updates on remediation progress</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Crediting researchers who report valid vulnerabilities (with their permission)</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Not pursuing legal action against good-faith security research</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Frequently Asked Questions</Trans>
                    </BlogArticleHeading>

                    <BlogFaqSection>
                        <BlogFaqItem question={<Trans>What happens to my data if I lose my phone?</Trans>}>
                            <Trans>
                                Your data exists only on your device. If you lose your phone without having synced to another device or
                                created an encrypted backup, your data is lost. This is the privacy tradeoff: we cannot help you recover data
                                because we do not have it. We recommend regular backups to your own storage.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Can law enforcement access my data through Budgie?</Trans>}>
                            <Trans>
                                We cannot provide your data to law enforcement or anyone else because we do not have it. There is no server to
                                subpoena, no database to query, and no backup to hand over. Your data is on your device, protected by your
                                device security and Budgie’s encryption.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Is the encryption implementation audited?</Trans>}>
                            <Trans>
                                Our encryption uses standard library implementations of AES-256 from platform security frameworks (iOS
                                CryptoKit, Android Keystore). These implementations are developed and audited by Apple and Google. Our
                                integration is documented in the open source code for community review.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>How do I export my data if I stop using Budgie?</Trans>}>
                            <Trans>
                                Budgie supports exporting your complete financial history in standard formats (CSV, JSON). You own your data,
                                and you can take it with you. The export happens locally, producing a file you can use with any other
                                application.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>What data do you collect through the app store?</Trans>}>
                            <Trans>
                                We collect anonymized crash reports through app store mechanisms (App Store Connect for iOS, Google Play
                                Console for Android). These reports do not contain financial data. We use them to fix bugs that cause crashes.
                                No other data is collected through any channel.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Why not use end-to-end encrypted cloud sync?</Trans>}>
                            <Trans>
                                End-to-end encrypted cloud sync would require servers to store encrypted blobs. While the content would be
                                encrypted, metadata would still be visible: when you sync, how much data you have, sync patterns that might
                                reveal usage habits. Device-to-device sync eliminates even this metadata exposure.
                            </Trans>
                        </BlogFaqItem>
                    </BlogFaqSection>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Taking Control of Your Financial Privacy</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Your financial data tells a complete story about your life. Where you live, where you shop, what you care about,
                            what struggles you face, what hopes you have. This data is valuable precisely because it is so revealing.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Budgie exists because we believe you should not have to trade this intimate information for the convenience of
                            expense tracking. Every architectural decision, from SQLite to local encryption to device-to-device sync, is
                            designed to keep this information where it belongs: <strong>under your control</strong>.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            We have described our approach in detail not because we think everyone needs to understand database architectures,
                            but because we believe you deserve to know exactly what an app does with your sensitive data. We invite you to
                            verify our claims, examine our code, and hold us accountable to the privacy standards we have set.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            For more details on our security architecture, visit our security section. To see the complete source code and
                            verify everything we have described, check out our open-source section.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Ready to try an expense tracker that respects your privacy? Join the waitlist and be among the first to experience
                            financial management without surveillance.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>
            </BlogArticleContent>

            <BlogArticleCta locale={lang} />
        </main>
    );
}
