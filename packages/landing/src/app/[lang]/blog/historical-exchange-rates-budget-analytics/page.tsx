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

const SLUG = 'historical-exchange-rates-budget-analytics';
const DATE = '2026-05-26';
// eslint-disable-next-line lingui/no-unlocalized-strings
const AUTHOR = 'Budgie Team';
const IMAGE = '/images/design-mode/ai-budgeting-app-4x.jpg';
const READING_TIME = 9;

const RELATED_SLUGS = ['mint-alternatives-developers', 'offline-first-bank-data-safety'] as const;

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildBlogArticleMetadata({
        author: AUTHOR,
        date: DATE,
        description: t(
            i18n
        )`Why a multi-currency expense tracker needs transaction-date valuation, not today's exchange rate, and how Budgie keeps imported history comparable in your base currency.`,
        image: IMAGE,
        keywords: t(
            i18n
        )`historical exchange rates budget app, multi currency expense tracker analytics, transaction date exchange rate, CSV import currency conversion`,
        locale: lang,
        slug: SLUG,
        title: t(i18n)`Historical Exchange Rates in Budget Analytics`
    });
}

export default async function HistoricalExchangeRatesBudgetAnalyticsArticle(props: PageLangParam) {
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
                )`Why a multi-currency expense tracker needs transaction-date valuation, not today's exchange rate, and how Budgie keeps imported history comparable in your base currency.`}
                homeLabel={t(i18n)`Home`}
                image={IMAGE}
                keywords={t(
                    i18n
                )`historical exchange rates budget app, multi currency expense tracker analytics, transaction date exchange rate, CSV import currency conversion`}
                locale={lang}
                slug={SLUG}
                title={t(i18n)`Historical Exchange Rates in Budget Analytics`}
            />

            <BlogArticleHero image={IMAGE} imageAlt={t(i18n)`Historical exchange rates in budget analytics`}>
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
                        <Trans>Historical Exchange Rates in Budget Analytics</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>Historical Exchange Rates in Budget Analytics</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>
                        A spending report should compare what money meant on the day you spent it. Budgie values each imported and newly
                        saved transaction in your base currency using the exchange rate from the transaction date.
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
                                <Trans>multi-currency</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>exchange rates</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>analytics</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>CSV import</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>bank sync</Trans>
                            </Badge>
                        </>
                    }
                />
            </BlogArticleHero>

            <BlogArticleContent>
                <BlogArticleSection>
                    <BlogArticleProse>
                        <Trans>
                            Multi-currency budgets fail quietly when they convert old spending with today’s rate. A coffee bought in hryvnia
                            ten years ago, a rent payment in dollars last month, and a bank import from yesterday cannot be added together
                            fairly unless every row carries a value in the same reporting currency.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Budgie’s answer is transaction-date valuation. Each transaction entry keeps its original amount and currency,
                            then stores a nullable base-currency value calculated from the best historical rate available for that date. The
                            original record stays intact, while analytics can sum one consistent value.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            This matters most after a migration. If you import years of spending from a previous app through{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/csv-import`}>
                                CSV import
                            </Link>
                            , Budgie can rebuild the base values from historical exchange rates instead of treating old rows as if they
                            happened today.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>The Rule: Store Original Truth and Reporting Value</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Every financial app has to choose what the transaction row means. Budgie separates two ideas that are often
                            mixed together:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Native amount</strong> — The exact amount in the account currency. This is what you spent, received,
                                or transferred, and it never changes when rates refresh.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Base amount</strong> — The value of that entry in your current reporting currency, calculated from
                                the exchange rate that belongs to the transaction date.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Base exchange rate</strong> — The rate used for that calculation, stored beside the entry so
                                analytics do not need to recalculate every chart on every screen.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            That gives Budgie two strengths at once. You can audit the original bank or CSV data, and{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/spending-analytics`}>
                                spending analytics
                            </Link>{' '}
                            can still sum categories, tags, and periods without guessing which rate to use.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>How Imported History Gets Repaired</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Older exports often contain the account currency and amount, but no exchange-rate snapshot. Budgie treats that
                            as incomplete valuation data, not as corrupt transaction data. The entry is still usable; it simply needs a base
                            value before it should affect multi-currency charts.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>The Upgrade Flow</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Budgie ships historical daily exchange-rate seeds in the local database migration.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                The Money Data upgrade scans entries where the base currency value is missing and groups them by date,
                                account currency, and base currency.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Each group is updated in bulk, which keeps large imports practical even when years of transactions need
                                valuation.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                While the upgrade runs, the settings screen shows progress and blocks interaction so analytics cannot be
                                read halfway through a rebuild.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            New transactions follow the same rule at write time. Manual entries, CSV imports, and{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/monobank-sync`}>
                                bank sync
                            </Link>{' '}
                            transactions save their base amount as they are inserted when the source does not already provide a usable
                            valuation.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Why Budgie Does Not Revalue Everything Every Day</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Net worth and account balances answer a different question from spending analytics. Net worth asks, “What are my
                            holdings worth now?” Spending analytics asks, “What did this cost me then?” Those questions should not share the
                            same conversion rule.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            For historical spending, Budgie keeps the transaction-date base value stable. If you change your main reporting
                            currency, the app can rebuild those stored values against the new base currency. If a better historical data
                            source is added, the same nullable columns can be recalculated without changing your original transaction
                            amounts.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            That is the point of{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/multi-currency`}>
                                multi-currency accounts
                            </Link>
                            : show today’s portfolio with today’s rates, but show historical expenses with historical rates.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Frequently Asked Questions</Trans>
                    </BlogArticleHeading>

                    <BlogFaqSection>
                        <BlogFaqItem question={<Trans>Does Budgie change my original imported amounts?</Trans>}>
                            <Trans>
                                No. The account-currency amount remains the source of truth. Base-currency fields are derived values used
                                for reporting and can be recalculated later.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>What happens if a historical rate is missing?</Trans>}>
                            <Trans>
                                Budgie leaves the base value empty until a suitable rate exists. That is safer than inventing a value,
                                because analytics can identify unvalued rows instead of silently mixing guessed totals with real totals.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Why store the base amount if it can be recalculated?</Trans>}>
                            <Trans>
                                Mobile analytics need to be fast. Storing the base amount lets Budgie sum large histories directly in SQL,
                                while keeping the exchange rate available for audit and future rebuilds.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Can historical values be rebuilt after changing my main currency?</Trans>}>
                            <Trans>
                                Yes. The stored base fields are nullable derived data. Budgie can clear and rebuild them from historical
                                rates while preserving the original transaction amounts.
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
