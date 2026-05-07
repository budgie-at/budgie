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

const SLUG = 'mint-shutdown-private-alternative';
const DATE = '2026-05-07';
// eslint-disable-next-line lingui/no-unlocalized-strings
const AUTHOR = 'Budgie Team';
const IMAGE = '/images/design-mode/ai-budgeting-app-4x.jpg';
const READING_TIME = 12;

const RELATED_SLUGS = ['mint-alternatives-developers', 'offline-first-privacy-financial-app'] as const;

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildBlogArticleMetadata({
        author: AUTHOR,
        date: DATE,
        description: t(
            i18n
        )`Mint shut down in 2024 and most replacements are still cloud-based. Here is why an offline-first, on-device tracker is the most durable answer for financial privacy.`,
        image: IMAGE,
        keywords: t(i18n)`Mint shutdown alternative, private Mint replacement, offline budget app after Mint, no cloud Mint alternative`,
        locale: lang,
        slug: SLUG,
        title: t(i18n)`After Mint: A Private, Offline Alternative That Actually Sticks Around`
    });
}

export default async function MintShutdownPrivateAlternativePage(props: PageLangParam) {
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
                )`Mint shut down in 2024 and most replacements are still cloud-based. Here is why an offline-first, on-device tracker is the most durable answer for financial privacy.`}
                homeLabel={t(i18n)`Home`}
                image={IMAGE}
                keywords={t(
                    i18n
                )`Mint shutdown alternative, private Mint replacement, offline budget app after Mint, no cloud Mint alternative`}
                locale={lang}
                slug={SLUG}
                title={t(i18n)`After Mint: A Private, Offline Alternative That Actually Sticks Around`}
            />

            <BlogArticleHero image={IMAGE} imageAlt={t(i18n)`Offline-first alternative to Mint after the shutdown`}>
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
                        <Trans>After Mint: A Private, Offline Alternative That Actually Sticks Around</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>After Mint: A Private, Offline Alternative That Actually Sticks Around</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>
                        Mint shut down in 2024 and most replacements are still cloud-based. Here is why an offline-first, on-device tracker
                        is the most durable answer for financial privacy.
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
                                <Trans>mint alternatives</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>offline-first</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>privacy</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>on-device</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>cloud shutdown</Trans>
                            </Badge>
                        </>
                    }
                />
            </BlogArticleHero>

            <BlogArticleContent>
                <BlogArticleSection>
                    <BlogArticleProse>
                        <Trans>
                            When Intuit Mint shut down on March 23, 2024, it left millions of users hunting for a replacement. Many found
                            one quickly — but most landed on apps that share the same fundamental architecture as Mint: your financial data
                            lives on someone else&apos;s servers, managed by a company whose priorities can shift without warning.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            This guide is not a generic list of apps. It is an argument for a different category entirely — one where
                            durability and privacy are architectural properties, not marketing promises.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>What Intuit Mint Actually Was</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Mint launched in 2007 as a free budgeting service that automatically categorized transactions by connecting to
                            bank accounts through a third-party aggregator. Intuit acquired it in 2009 for $170 million, and for many years
                            it was genuinely the easiest way to see all of your accounts in one place.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            The product was free because your data was the product. Mint revenue came from recommending financial products —
                            credit cards, loans, insurance — based on your spending patterns. As Intuit priorities shifted toward other
                            products, investment in Mint dried up, bank connections became unreliable, and eventually the service was
                            discontinued entirely.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            The shutdown was not a surprise to anyone paying attention. It was the predictable end of an ad-supported,
                            cloud-hosted service that was never designed around user ownership of data.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Why Most Mint Alternatives Have the Same Problem</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Open any list of Mint alternatives and you will find subscription-based cloud services, ad-supported web apps,
                            and venture-funded startups. Each of them recreates the same architecture: your credentials go to an aggregator,
                            your transactions flow to a server, a company stores your financial history indefinitely.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>The Three Failure Modes of Cloud Finance Apps</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Vendor shutdown</strong> — Mint proved this is real. A startup running out of funding or a corporate
                                parent deprioritizing a product can end your access to years of financial history overnight.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Aggregator breach</strong> — Every cloud budgeting app that uses bank-feed aggregation pools
                                credentials from millions of users into one target. A single breach exposes everyone.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Business model drift</strong> — Free tiers disappear. Subscription prices rise. Data-sharing
                                policies get quietly updated. What the service is today is not what it will be in three years.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>Moving from Mint to another cloud service does not solve the problem. It reschedules it.</Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>What Durable Means for a Finance App</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            A durable personal finance app has properties that do not depend on any company staying in business or staying
                            honest. Here is what that looks like in practice:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Local data storage</strong> — Your transaction history lives on your device, in a format you can
                                read and export. No internet connection required to access your own records.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>No vendor account required</strong> — You do not need to create an account with a company to use the
                                app. There is no account to close, no subscription to cancel, no data to request deletion of.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Open source codebase</strong> — If the developer stops maintaining the app, the community can fork
                                it. The code is auditable. You can verify that the privacy claims are real.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Your-cloud backup</strong> — Encrypted backups that you store in your own cloud storage (iCloud,
                                Google Drive, Dropbox) or locally, not on the developer&apos;s servers.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Standard export formats</strong> — CSV, JSON, or SQL exports that you can import into any
                                spreadsheet or another app if you ever choose to leave.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>An Offline-First Answer: Budgie</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Budgie is an offline-first expense tracker built for iOS and Android. All data is stored in an encrypted SQLite
                            database on your device. There are no Budgie servers that receive your transactions, no aggregator that holds
                            your bank credentials, and no subscription required to use the core features.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Eight Features That Make It a Durable Mint Replacement</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>On-device SQLite storage</strong> — Every transaction, account, and category is stored locally in an
                                encrypted database. Budgie works fully offline; connectivity is optional, never required.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>AES-256 database encryption</strong> — The database is encrypted at rest. Even if someone gains
                                physical access to your device, they cannot read your financial data without the key.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Direct bank sync without aggregator intermediaries</strong> — Budgie bank connection for supported
                                banks communicates directly from your device to your bank. No third-party aggregator receives your
                                credentials or stores your transaction stream.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>CSV and PDF import</strong> — Export a statement from any bank website and import it into Budgie.
                                This works with every bank on the planet, requires no API key, and leaves no credential exposure.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>On-device AI categorization</strong> — A small language model runs entirely on your device to
                                suggest categories for new transactions. Your spending patterns are never sent to a cloud AI service.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Encrypted local backup</strong> — Create a backup of your entire database at any time and save it to
                                iCloud, a USB drive, or anywhere you choose. Budgie does not hold your backup.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Open source</strong> — The codebase is public. Privacy claims are verifiable by anyone with a
                                browser and a GitHub account.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Multi-currency support</strong> — Track accounts in different currencies and view balances in a
                                single base currency with exchange rates fetched anonymously.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Migrating from Mint to Budgie: A Practical Walkthrough</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            If you exported your Mint data before the shutdown, or if you have statements from your bank, migration is
                            straightforward. Here is how to bring your history into Budgie.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Step 1: Export Your Transaction History</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            If you still have a Mint CSV export, open it in a spreadsheet app and verify the column names: date,
                            description, amount, and category. Budgie CSV importer maps standard Mint columns automatically.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            If you no longer have your Mint export, download statements directly from your bank website. Most banks offer
                            CSV or Excel downloads going back 12 to 24 months. PDF statements from any period also work with Budgie PDF
                            import.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Step 2: Set Up Your Accounts in Budgie</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Create an account in Budgie for each bank account or credit card you track. Set the correct currency for each
                            account. You do not need to connect anything to your bank at this stage — the accounts are just containers for
                            imported transactions.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Step 3: Import Your Transactions</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Use Budgie CSV import screen to map your file columns to Budgie fields. The importer shows a preview of the
                            first few rows so you can verify the mapping before committing. Budgie deduplicates transactions on import, so
                            overlapping date ranges between files will not create duplicates.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Step 4: Set Up Categories and Recurring Transactions</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Budgie on-device AI suggests categories as you review imported transactions. You can also define custom
                            categories and set up recurring transaction templates for bills and subscriptions so future entries are
                            categorized automatically.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Step 5: Optional — Enable Direct Bank Sync</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            For supported banks, Budgie can sync new transactions directly from your device. This replaces the manual import
                            step for ongoing use. For banks not yet supported by direct sync, continuing with periodic CSV imports is a
                            perfectly sustainable workflow.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Frequently Asked Questions</Trans>
                    </BlogArticleHeading>

                    <BlogFaqSection>
                        <BlogFaqItem question={<Trans>Is Budgie really free to use?</Trans>}>
                            <Trans>
                                Budgie has a free tier that covers core expense tracking. Unlike ad-supported models, the free tier does not
                                monetize your spending data. There is no advertising and no data brokering.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>What happens to my data if Budgie ever shuts down?</Trans>}>
                            <Trans>
                                Because your data is stored on your device and backed up to your own storage, nothing happens. You keep your
                                database. Budgie is also open source, so the community can continue maintaining the app independently of any
                                company decisions.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Can I import years of Mint transaction history?</Trans>}>
                            <Trans>
                                Yes. Budgie CSV importer handles large files and deduplicates on transaction date, description, and amount.
                                If your Mint export was a single file covering multiple years, you can import it in one step.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Does Budgie work without an internet connection?</Trans>}>
                            <Trans>
                                Yes. All core functionality — adding transactions, viewing reports, managing budgets, and reviewing your
                                history — works completely offline. Internet access is only used when you explicitly trigger a bank sync or
                                fetch current exchange rates.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>How is Budgie different from a cloud budgeting app?</Trans>}>
                            <Trans>
                                The fundamental difference is where your data lives. Cloud apps store your transaction history on company
                                servers. Budgie stores it in an encrypted database on your device. That difference determines who controls
                                your financial data, who can access it, and what happens when the company changes its mind about the
                                product.
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
