/* eslint-disable max-lines, max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import { BlogArticleContent } from '../../../../blog/component/blog-article-content/blog-article-content';
import { BlogArticleCta } from '../../../../blog/component/blog-article-cta/blog-article-cta';
import { BlogArticleHeading } from '../../../../blog/component/blog-article-heading/blog-article-heading';
import { BlogArticleHero } from '../../../../blog/component/blog-article-hero/blog-article-hero';
import { BlogArticleListItem } from '../../../../blog/component/blog-article-list-item/blog-article-list-item';
import { BlogArticleList } from '../../../../blog/component/blog-article-list/blog-article-list';
import { BlogArticleMeta } from '../../../../blog/component/blog-article-meta/blog-article-meta';
import { BlogArticleProse } from '../../../../blog/component/blog-article-prose/blog-article-prose';
import { BlogArticleSection } from '../../../../blog/component/blog-article-section/blog-article-section';
import { BlogBreadcrumbCurrent } from '../../../../blog/component/blog-breadcrumb-current/blog-breadcrumb-current';
import { BlogBreadcrumbLink } from '../../../../blog/component/blog-breadcrumb-link/blog-breadcrumb-link';
import { BlogBreadcrumbs } from '../../../../blog/component/blog-breadcrumbs/blog-breadcrumbs';
import { BlogFaqItem } from '../../../../blog/component/blog-faq-item/blog-faq-item';
import { BlogFaqSection } from '../../../../blog/component/blog-faq-section/blog-faq-section';
import { BlogPostingJsonLd } from '../../../../blog/component/blog-posting-json-ld/blog-posting-json-ld';
import { RelatedArticles } from '../../../../blog/component/related-articles/related-articles';
import { buildBlogArticleMetadata } from '../../../../blog/util/build-blog-article-metadata.util';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';
import { Badge } from '../../../../ui/badge';

import { ARTICLE_METADATA } from './metadata';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildBlogArticleMetadata({
        author: ARTICLE_METADATA.author,
        date: ARTICLE_METADATA.date,
        description: i18n._(ARTICLE_METADATA.seoDescription),
        keywords: ARTICLE_METADATA.seoKeywords.join(', '),
        locale: lang,
        slug: ARTICLE_METADATA.slug,
        title: i18n._(ARTICLE_METADATA.title)
    });
}

export default async function WhatsNewAugustSeptember2026Article(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    return (
        <main className="flex-1">
            <BlogPostingJsonLd
                author={ARTICLE_METADATA.author}
                blogLabel={t(i18n)`Blog`}
                date={ARTICLE_METADATA.date}
                description={i18n._(ARTICLE_METADATA.description)}
                homeLabel={t(i18n)`Home`}
                image={`/${lang}/blog/${ARTICLE_METADATA.slug}/opengraph-image`}
                keywords={ARTICLE_METADATA.seoKeywords.join(', ')}
                locale={lang}
                slug={ARTICLE_METADATA.slug}
                title={i18n._(ARTICLE_METADATA.title)}
            />

            <BlogArticleHero article={ARTICLE_METADATA} locale={lang}>
                <BlogBreadcrumbs>
                    <BlogBreadcrumbLink href={`/${lang}`} position={1}>
                        <Trans>Home</Trans>
                    </BlogBreadcrumbLink>
                    <BlogBreadcrumbLink href={`/${lang}/blog`} position={2}>
                        <Trans>Blog</Trans>
                    </BlogBreadcrumbLink>
                    <BlogBreadcrumbCurrent position={3}>
                        <Trans>What&rsquo;s New: Bank Integrations, Binance Sync, Deposits, and Debt</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>What&rsquo;s New: Bank Integrations, Binance Sync, Deposits, and Debt</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>
                        A lot shipped between August and September 2026 with zero announcement. Here is what changed, grouped by area, with
                        no marketing gloss — just what the app does differently today.
                    </Trans>
                </p>

                <BlogArticleMeta
                    author={ARTICLE_METADATA.author}
                    date={ARTICLE_METADATA.date}
                    locale={lang}
                    readingTimeMinutes={ARTICLE_METADATA.readingTimeMinutes}
                    tags={
                        <>
                            <Badge variant="secondary">
                                <Trans>bank sync</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>binance sync</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>deposits</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>debt</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>performance</Trans>
                            </Badge>
                        </>
                    }
                />
            </BlogArticleHero>

            <BlogArticleContent>
                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Bank connections became a first-class object</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Bank sync used to be a per-provider afterthought. It is now a capability-driven settings surface: each
                            integration declares what it can do, the settings page renders those capabilities generically instead of
                            hard-coding a screen per bank, and you can add more accounts from an already-connected bank without leaving the
                            integration page. Home-screen accounts now group by integration instead of listing every synced account flat.
                            See{' '}
                            <Link
                                className="font-semibold underline underline-offset-4"
                                href={`/${lang}/features/bank-integration-management`}
                            >
                                bank integration management
                            </Link>{' '}
                            for the full picture.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Binance sync, with bank↔P2P consolidation</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Binance accounts sync directly, including P2P trades reconciled against your bank transactions so a P2P buy and
                            the matching bank transfer do not double-count as two separate expenses. Crypto grouping was also corrected
                            twice this cycle: exchange-synced coins stay under their exchange section, while self-custodied coins group by
                            currency instead — the two flows now stay visually and logically separate. Details on{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/binance-sync`}>
                                Binance sync
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Deposits are a dedicated account type</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Fixed-term deposits now have their own account type with an interest rate field, a routed creation form, and a
                            Close Deposit action that transfers the balance to a destination account of your choice — including inline
                            deposit creation directly from the convert-to-transfer picker. Deposits are excluded from expense-source lists
                            by default, since maturing a deposit is not spending. See{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/deposit-tracking`}>
                                deposit tracking
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Debt balances and settlement got a rework</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Debt balance semantics are now unified across the debt tile and the underlying ledger, the progress indicator
                            was redesigned around a neutral module instead of a colored bar that implied good or bad, and settling a debt
                            now categorizes the resulting expense as a dedicated Debt Payment instead of falling into a generic category. A
                            backfill hardened existing debt settlements against the old categorization. See{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/debt-tracking`}>
                                debt &amp; loan tracking
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Transactions: amount-range filtering and a read-only detail view</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            The transactions list now supports filtering by amount range in addition to date, category, tag, and account.
                            Opening a transaction shows a read-only detail view with six-month similar-spend bars, so you can see whether an
                            amount is typical for that merchant or category without leaving the screen. Several split-confirmation keyboard
                            bugs were also fixed, so entering split amounts on a physical or software keyboard no longer misbehaves
                            mid-edit.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Consolidation accuracy: the least visible, most impressive work</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Consolidation is what decides when two bank rows — a card payment and a settlement, a transfer leg and its
                            counterpart — are really the same movement of money. This cycle tightened that engine on several fronts at once:
                            Monobank payment-refund titles now match correctly, FX-tolerant bridge chains reclaim with a rebuild fallback
                            instead of failing outright, absorbed transactions are restored rather than deleted when you unconsolidate,
                            mutual-best refunds are accepted instead of dropping an over-sum group, a fee-return refund is recognized when
                            the fee entry exceeds the primary credit, and a bridge family stands down cleanly when an existing same-pair
                            canonical already covers it. None of this is visible in a screenshot — it shows up as fewer duplicate or
                            orphaned transactions after a bank sync.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Startup performance: on-device AI without a slow launch</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Running a large language model and a Whisper speech model on-device raises an obvious question: does the app
                            stay fast to open? This cycle deferred llama and Whisper module evaluation past the first rendered frame,
                            switched lucide icons to per-icon lazy imports, gated Lingui catalog loading behind an activation check instead
                            of loading every locale eagerly, deferred sync services and background task registration off the boot path,
                            dropped unreferenced embedded fonts, switched to date-fns deep subpath imports, and removed the intl-pluralrules
                            polyfill now that Hermes ships it natively. Each change is small; together they keep first paint fast even with
                            two on-device models available.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Visual and platform updates</Trans>
                    </BlogArticleHeading>
                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Fastlane-generated store screenshots for all five supported locales.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                A screen chrome redesign: progressive blur behind the header, a collapsible header on scroll, and a fix for
                                the iOS 26 safe-area edge case.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Taps now fall through the collapsible header shell instead of being swallowed by it.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Every account type now has its own color, not just its own icon — see the account management page.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Monobank SDK upgraded to 0.7.0 for live client-info payloads.</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Frequently Asked Questions</Trans>
                    </BlogArticleHeading>

                    <BlogFaqSection locale={lang}>
                        <BlogFaqItem question={<Trans>Do I need to do anything to get these changes?</Trans>}>
                            <Trans>
                                No. All of this ships in the regular app update. Deposit and debt accounts are opt-in — you only see the new
                                fields when you create or edit that account type.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Will consolidation re-process my existing transactions?</Trans>}>
                            <Trans>
                                The accuracy fixes apply going forward and to the specific edge cases the backfills targeted. They do not
                                rewrite unrelated transaction history.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Is there a full changelog with every release?</Trans>}>
                            <Trans>
                                This post groups the user-visible work from one release window. It is not a line-by-line release log — check
                                the app store listing for the exact version history.
                            </Trans>
                        </BlogFaqItem>
                    </BlogFaqSection>
                </BlogArticleSection>
            </BlogArticleContent>

            <BlogArticleCta locale={lang} />

            <RelatedArticles locale={lang} slugs={ARTICLE_METADATA.relatedArticleSlugs} />

            <FeaturePageRelated locale={lang} slugs={ARTICLE_METADATA.relatedFeatureSlugs} />
        </main>
    );
}
