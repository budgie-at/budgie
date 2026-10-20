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
import { BlogBreadcrumbCurrent } from '../../../../blog/component/blog-breadcrumb-current/blog-breadcrumb-current';
import { BlogBreadcrumbLink } from '../../../../blog/component/blog-breadcrumb-link/blog-breadcrumb-link';
import { BlogBreadcrumbs } from '../../../../blog/component/blog-breadcrumbs/blog-breadcrumbs';
import { BlogFaqItem } from '../../../../blog/component/blog-faq-item/blog-faq-item';
import { BlogFaqSection } from '../../../../blog/component/blog-faq-section/blog-faq-section';
import { createBlogGenerateMetadata } from '../../../../blog/utils/create-blog-generate-metadata.util';
import { AppShot } from '../../../../generic/component/app-shot/app-shot';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';
import { Badge } from '../../../../ui/badge';

import { ARTICLE_METADATA } from './metadata';

export const generateMetadata = createBlogGenerateMetadata(ARTICLE_METADATA);

export default async function MonobankExpenseTrackingArticle(props: PageLangParam) {
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
                        <Trans>Monobank expense tracking</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>How to track your Monobank spending automatically</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>
                        Once Monobank is connected to Budgie, most of the bookkeeping does itself: purchases arrive on their own and land in
                        categories, transfers between your own cards stop looking like spending, and your monthly budget fills in as you
                        pay. Here is what happens at each step, and where you still have the last word.
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
                                <Trans>monobank</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>budgeting</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>how-to</Trans>
                            </Badge>
                        </>
                    }
                />
            </BlogArticleHero>

            <BlogArticleContent>
                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Connect once</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            This guide starts where setup ends. If Monobank is not connected yet, follow{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/blog/monobank-api-token`}>
                                how to get a Monobank token and connect it
                            </Link>{' '}
                            first: it takes about two minutes and helps you choose how much history to load.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            After that, every card and jar you picked is its own account in Budgie, grouped under Monobank, with a switch to
                            pause any of them. Everything below happens without another tap.
                        </Trans>
                    </BlogArticleProse>

                    <figure className="mx-auto my-4 w-full max-w-[18rem]">
                        <AppShot
                            alt={t(i18n)`Budgie Monobank screen listing two cards and a jar, each with its balance and a sync switch`}
                            locale={lang}
                            scene="monobank-sync-1"
                            sizes="18rem"
                            slug="monobank-sync"
                        />
                        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
                            <Trans>Your Monobank cards and jars, each with its balance and its own switch.</Trans>
                        </figcaption>
                    </figure>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>1. Transactions arrive by themselves</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Budgie fetches new Monobank transactions every time you open the app or come back to it, and it also checks in
                            the background from time to time. How often those background checks run is up to your phone&rsquo;s system, so
                            opening the app is the quickest way to see a purchase you have just made.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            Each transaction comes in with the merchant name and the amount, plus the comment if you left one in Monobank.
                            Transactions that are already in Budgie are recognised, so a new sync never adds them twice.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>2. Categories from merchant codes</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Every card payment carries a merchant category code, a four-digit number that tells what kind of business took
                            the money: a supermarket, a pharmacy, a taxi. Budgie knows a default category for about 1,050 of these codes, so
                            a payment at Silpo is already in Groceries before you ever open it. See{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/mcc-auto-category`}>
                                automatic categories from merchant codes
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>

                    <figure className="mx-auto my-4 w-full max-w-[18rem]">
                        <AppShot
                            alt={t(
                                i18n
                            )`Budgie expense screen for a Silpo payment from a Monobank card, with the Grocery merchant code under the name and Groceries as the category`}
                            locale={lang}
                            scene="mcc-auto-category-1"
                            sizes="18rem"
                            slug="mcc-auto-category"
                        />
                        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
                            <Trans>The merchant code under the name, and the category Budgie picked from it.</Trans>
                        </figcaption>
                    </figure>

                    <BlogArticleProse>
                        <Trans>
                            The switch lives in Settings, under General: Auto-assign categories from MCC. It is on by default. Turn it off
                            if you would rather choose every category yourself; the change applies to transactions that arrive after it.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            Whatever still has no category is counted in the Missing categories pill above your transaction list, and the
                            Categorize screen lets you sort those transactions in bulk.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>3. Your rules have the last word</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Merchant codes are broad: a supermarket code does not know you bought a gift there. When you want a merchant
                            handled your way every time, use a rule. A rule can look at the merchant name, the comment, the amount, the
                            account, the merchant code or the transaction type, and it sets a category, adds tags, or both.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            Rules run on every new Monobank transaction, and a rule&rsquo;s category wins over the merchant-code default.
                            You rarely have to write one from scratch: change the category or the tags of a transaction and a Quick rule
                            pill appears above the amount. Tap it, and the rule is saved for that merchant. See{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/categorization-rules`}>
                                categorization rules
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>4. Transfers between your cards and jars are merged</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Topping up a jar from your card shows up twice: once as money leaving the card and once as money arriving in the
                            jar. Counted as is, that looks like a purchase you never made. Budgie finds such pairs between your own accounts
                            and merges each one into a single transfer, which counts as neither spending nor income.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            A merged transfer keeps its originals: open it and tap View source transactions to see both, or Revert to split
                            them again. When a pair is not clear enough, Budgie leaves both transactions as they arrived instead of
                            guessing. More in{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/transfer-pair-detection`}>
                                transfer pair detection
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>5. Fees get their own line</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            When Monobank charges a commission on a transaction, Budgie splits it off into a separate line in Bank Fees
                            &amp; Charges. The payment keeps its real amount, the fee still counts as spending, and it stays in place even
                            when the payment is merged into a transfer. Over a month you see exactly how much went to the bank.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>6. A budget that fills in as you pay</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Budgets in Budgie are monthly: one overall limit plus limits for the categories you care about. Every
                            categorized Monobank purchase counts toward them as soon as it arrives, so the budget shows what is spent and
                            what is left without you typing anything.
                        </Trans>
                    </BlogArticleProse>

                    <figure className="mx-auto my-4 w-full max-w-[18rem]">
                        <AppShot
                            alt={t(
                                i18n
                            )`Budgie budget details with the monthly budget 95% spent and limits for housing, groceries, transport and car`}
                            locale={lang}
                            scene="budget-planning-2"
                            sizes="18rem"
                            slug="budget-planning"
                        />
                        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
                            <Trans>Spent, left and over budget for each category, updated as transactions arrive.</Trans>
                        </figcaption>
                    </figure>

                    <BlogArticleProse>
                        <Trans>
                            If you loaded a few months of history when you connected, creating a budget offers a Suggested option built from
                            your recent spending, so your first limits come from real numbers. Turn on Budget alerts in Settings to get a
                            notification at 80% and at 100% of a limit. See{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/budget-planning`}>
                                budget planning
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>7. See where the money goes</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Analytics breaks your spending down by category and by tag for the period you pick. Transfers between your own
                            accounts stay out and bank fees stay in, so the totals match what actually left your pocket. See{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/spending-analytics`}>
                                spending analytics
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>

                    <figure className="mx-auto my-4 w-full max-w-[18rem]">
                        <AppShot
                            alt={t(
                                i18n
                            )`Budgie analytics for this month with spent, income and balance totals and spending broken down by category`}
                            locale={lang}
                            scene="spending-analytics-1"
                            sizes="18rem"
                            slug="spending-analytics"
                        />
                        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
                            <Trans>A month of spending by category, with your own transfers left out.</Trans>
                        </figcaption>
                    </figure>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>A five-minute weekly routine</Trans>
                    </BlogArticleHeading>
                    <BlogArticleList ordered>
                        <BlogArticleListItem>
                            <Trans>Open Budgie so the latest Monobank transactions come in.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Tap the Missing categories pill and sort whatever is left.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>When you fix the same merchant a second time, accept the Quick rule so it never comes back.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Look at the budget: the categories close to their limit are the ones to watch this week.</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Frequently Asked Questions</Trans>
                    </BlogArticleHeading>

                    <BlogFaqSection locale={lang}>
                        <BlogFaqItem question={<Trans>Do I still need to enter anything by hand?</Trans>}>
                            <Trans>
                                Not for your Monobank cards and jars. Cash, and accounts at banks Budgie does not sync, still need to be
                                added by hand or imported from a file.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Does topping up a jar count as spending?</Trans>}>
                            <Trans>
                                No. A top-up from your card to a jar is merged into one transfer between your own accounts, and budgets and
                                analytics leave transfers out.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Can I turn off automatic categories?</Trans>}>
                            <Trans>
                                Yes. Switch off Auto-assign categories from MCC in Settings, under General. Your rules keep working either
                                way.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Does it work while the app is closed?</Trans>}>
                            <Trans>
                                Yes. Budgie checks for new transactions in the background, at a pace your phone&rsquo;s system decides. Open
                                the app to fetch the latest ones right away.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Does Budgie see my transactions on its servers?</Trans>}>
                            <Trans>
                                No. Your phone requests your data from Monobank directly and keeps it on the device. Budgie has no server of
                                its own that receives your transactions.
                            </Trans>
                        </BlogFaqItem>
                    </BlogFaqSection>
                </BlogArticleSection>
            </BlogArticleContent>
        </BlogArticlePageShell>
    );
}
