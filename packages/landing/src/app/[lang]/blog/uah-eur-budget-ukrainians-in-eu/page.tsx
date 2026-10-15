/* eslint-disable max-lines, max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import { BlogArticleContent } from '../../../../blog/component/blog-article-content/blog-article-content';
import { BlogArticleHeading } from '../../../../blog/component/blog-article-heading/blog-article-heading';
import { BlogArticleHero } from '../../../../blog/component/blog-article-hero/blog-article-hero';
import { BlogArticleListItem } from '../../../../blog/component/blog-article-list-item/blog-article-list-item';
import { BlogArticleList } from '../../../../blog/component/blog-article-list/blog-article-list';
import { BlogArticleMeta } from '../../../../blog/component/blog-article-meta/blog-article-meta';
import { BlogArticlePageShell } from '../../../../blog/component/blog-article-page-shell/blog-article-page-shell';
import { BlogArticleProse } from '../../../../blog/component/blog-article-prose/blog-article-prose';
import { BlogArticleSection } from '../../../../blog/component/blog-article-section/blog-article-section';
import { BlogArticleSubheading } from '../../../../blog/component/blog-article-subheading/blog-article-subheading';
import { BlogBreadcrumbCurrent } from '../../../../blog/component/blog-breadcrumb-current/blog-breadcrumb-current';
import { BlogBreadcrumbLink } from '../../../../blog/component/blog-breadcrumb-link/blog-breadcrumb-link';
import { BlogBreadcrumbs } from '../../../../blog/component/blog-breadcrumbs/blog-breadcrumbs';
import { BlogFaqItem } from '../../../../blog/component/blog-faq-item/blog-faq-item';
import { BlogFaqSection } from '../../../../blog/component/blog-faq-section/blog-faq-section';
import { createBlogGenerateMetadata } from '../../../../blog/utils/create-blog-generate-metadata.util';
import { FeaturePageMedia } from '../../../../feature/component/feature-page-media/feature-page-media';
import { AppShot } from '../../../../generic/component/app-shot/app-shot';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';
import { Badge } from '../../../../ui/badge';

import { ARTICLE_METADATA } from './metadata';

export const generateMetadata = createBlogGenerateMetadata(ARTICLE_METADATA);

export default async function UahEurBudgetUkrainiansInEuArticle(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    return (
        <BlogArticlePageShell article={ARTICLE_METADATA} lang={lang}>
            <BlogArticleHero article={ARTICLE_METADATA} locale={lang}>
                <BlogBreadcrumbs>
                    <BlogBreadcrumbLink href={`/${lang}`} position={1}>
                        <Trans>Home</Trans>
                    </BlogBreadcrumbLink>
                    <BlogBreadcrumbLink href={`/${lang}/blog`} position={2}>
                        <Trans>Blog</Trans>
                    </BlogBreadcrumbLink>
                    <BlogBreadcrumbCurrent position={3}>
                        <Trans>UAH and EUR Accounts in One Budget App</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>UAH and EUR Accounts in One Budget App: A Guide for Ukrainians in the EU</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>
                        Your salary arrives in euros, your Monobank card still pays in hryvnia, and there is cash in both currencies in your
                        wallet. Here is how to keep all of it in one budget and see one honest total.
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
                                <Trans>multi-currency</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>Monobank</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>Erste Bank</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>net worth</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>exchange rates</Trans>
                            </Badge>
                        </>
                    }
                />
            </BlogArticleHero>

            <BlogArticleContent>
                <BlogArticleSection>
                    <BlogArticleProse>
                        <Trans>
                            Many Ukrainians who moved to the EU live in two currencies at once. Rent, groceries and the salary are in euros
                            at a local bank. The Monobank card stays active for family transfers, subscriptions and payments back home. And
                            there is always some cash: euros in the wallet, hryvnia in a drawer.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Two banking apps and a spreadsheet cannot answer the simple questions: how much do I have in total, and how much
                            did I spend this month? Budgie puts every account in one app, keeps each one in its own currency, and shows
                            totals in the currency you choose.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Step 1. Bring in every account</Trans>
                    </BlogArticleHeading>

                    <BlogArticleSubheading>
                        <Trans>Monobank: automatic sync</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Connect Monobank with your personal token, choose the cards and jars you want to follow, and Budgie keeps
                            pulling new transactions on its own. Each card keeps its own currency, so a hryvnia card stays in hryvnia.
                            Details are on the{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/monobank-sync`}>
                                Monobank sync
                            </Link>{' '}
                            page.
                        </Trans>
                    </BlogArticleProse>

                    <FeaturePageMedia>
                        <AppShot
                            alt={t(i18n)`Monobank cards and jars selected for sync in Budgie`}
                            locale={lang}
                            scene="monobank-sync-1"
                            sizes="(min-width: 768px) 19rem, 17rem"
                            slug="monobank-sync"
                        />
                    </FeaturePageMedia>

                    <BlogArticleSubheading>
                        <Trans>Your EU bank: statement import</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            If you bank with Erste Bank, import the PDF statement straight from your phone with{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/erste-bank-pdf-import`}>
                                Erste Bank PDF import
                            </Link>
                            : you see a preview of every transaction before anything is saved. For other banks, export a CSV statement and
                            match its columns once with{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/csv-import`}>
                                CSV import
                            </Link>
                            , including the currency of each row.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Cash in both currencies</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Create a cash account for euros and another one for hryvnia. Every account has its own currency, so you record
                            spending in the money you actually paid with and nothing gets converted behind your back.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Step 2. Pick the currency for your totals</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            In Settings, choose your main currency. Most people living in the EU pick the euro, but you can keep the hryvnia
                            if that is how you think about money. Your total balance, net worth and spending reports are shown in that
                            currency, and you can switch it at any time.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            The{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/net-worth-tracker`}>
                                net worth tracker
                            </Link>{' '}
                            adds up every account you include, converted at current exchange rates, while each account card still shows its
                            balance in its own currency.
                        </Trans>
                    </BlogArticleProse>

                    <FeaturePageMedia>
                        <AppShot
                            alt={t(i18n)`Budgie home screen with one total balance across accounts in different currencies`}
                            locale={lang}
                            scene="net-worth-tracker-1"
                            sizes="(min-width: 768px) 19rem, 17rem"
                            slug="net-worth-tracker"
                        />
                    </FeaturePageMedia>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Step 3. Past spending at past exchange rates</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            The hryvnia-to-euro rate has moved a lot over the years. If last year’s spending were converted at today’s rate,
                            your reports would quietly rewrite your history. Budgie ships with years of daily exchange rates, so
                            transactions you import from past years are valued at the rate of the day they happened.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            The original amount in the account currency never changes. The value in your main currency is kept next to it
                            for reports. Why this matters is explained in{' '}
                            <Link
                                className="font-semibold underline underline-offset-4"
                                href={`/${lang}/blog/historical-exchange-rates-budget-analytics`}
                            >
                                historical exchange rates in budget analytics
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Step 4. Transfers between hryvnia and euro</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            When you move money from your euro account to your Monobank card, record it as a transfer, not as an expense.
                            Budgie suggests the current exchange rate, and you can type the amount that actually arrived. The transfer keeps
                            both amounts and the rate, so both balances stay correct and the move does not inflate your spending.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            If a synced or imported payment turns out to be such a move, convert it to a transfer from the transaction
                            itself and pick the other account. Learn more about{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/multi-currency`}>
                                multi-currency accounts
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>

                    <FeaturePageMedia>
                        <AppShot
                            alt={t(i18n)`Accounts in several currencies on the Budgie home screen`}
                            locale={lang}
                            scene="multi-currency-1"
                            sizes="(min-width: 768px) 19rem, 17rem"
                            slug="multi-currency"
                        />
                    </FeaturePageMedia>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Step 5. Budgets and reports in one currency</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            A monthly budget has one currency, and spending from every account counts towards it, converted automatically.
                            Pay for groceries with your euro card and for a subscription with your hryvnia card, and both land in the same
                            category limit.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Spending reports by category and tag are shown in your main currency too, so you finally see what life costs you
                            per month, whichever card you used.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>A quick setup checklist</Trans>
                    </BlogArticleHeading>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Connect Monobank and choose the cards and jars to follow.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Import your EU bank statement: an Erste Bank PDF or a CSV from another bank.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Add cash accounts in euros and in hryvnia.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Choose your main currency in Settings.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Record moves between your own accounts as transfers.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Set a monthly budget in the currency you live in.</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Frequently Asked Questions</Trans>
                    </BlogArticleHeading>

                    <BlogFaqSection locale={lang}>
                        <BlogFaqItem question={<Trans>Do I have to convert hryvnia to euro by hand?</Trans>}>
                            <Trans>
                                No. Each account stays in its own currency, and Budgie converts totals, budgets and reports into your main
                                currency for you.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Which main currency should I choose?</Trans>}>
                            <Trans>
                                The one you earn and spend most in. For most Ukrainians in the EU that is the euro. You can change it later
                                in Settings, and the totals follow.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>My EU bank is not Erste Bank. Can I still use Budgie?</Trans>}>
                            <Trans>
                                Yes. If your bank lets you export a CSV statement, map its columns once in CSV import. You can also add
                                transactions by hand.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Does a change in the exchange rate change my past spending?</Trans>}>
                            <Trans>
                                No. Your original amounts stay as they were. Past spending keeps the value of the day it happened, and only
                                your current balances follow today’s rates.
                            </Trans>
                        </BlogFaqItem>
                    </BlogFaqSection>
                </BlogArticleSection>
            </BlogArticleContent>
        </BlogArticlePageShell>
    );
}
