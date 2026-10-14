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
import { FeaturePageMedia } from '../../../../feature/component/feature-page-media/feature-page-media';
import { AppShot } from '../../../../generic/component/app-shot/app-shot';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';
import { Badge } from '../../../../ui/badge';

import { ARTICLE_METADATA } from './metadata';

export const generateMetadata = createBlogGenerateMetadata(ARTICLE_METADATA);

export default async function TrackMoneyYouLentAndBorrowedArticle(props: PageLangParam) {
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
                        <Trans>Who owes me? How to track money you lent and borrowed</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>Who owes me? How to track money you lent and borrowed</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>
                        You lent a friend money for a ticket, borrowed from your parents for a deposit, and a month later nobody remembers
                        the exact amounts. This guide shows how to keep track of debts in Budgie: who owes you, whom you owe, how much has
                        already come back, and what is still left.
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
                                <Trans>debts</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>lending</Trans>
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
                        <Trans>Why debts between people get lost</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Money you lend to friends rarely comes back in one piece. It returns in parts, by card transfer, in cash,
                            sometimes with a little extra. A note on your phone does not add up those parts, and your bank statement shows
                            only a transfer to a person, not what it was for. To know who owes you, every loan and every repayment has to
                            land in one place.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            In Budgie that place is a debt account. It works in both directions: money you lent and money you borrowed. The
                            money itself still moves through your real accounts, while the debt keeps the score: how much in total, how much
                            has been returned, and how much is left.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Step 1: create a debt and choose its direction</Trans>
                    </BlogArticleHeading>
                    <BlogArticleList ordered>
                        <BlogArticleListItem>
                            <Trans>Tap the plus button, choose &ldquo;Account&rdquo; and then &ldquo;Debt Account&rdquo;.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Pick the direction: &ldquo;Lent&rdquo; when you gave money, &ldquo;Borrowed&rdquo; when you received it.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Name the debt, choose its currency and enter the amount in &ldquo;Target balance&rdquo;.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Optionally pick a person from your phone contacts and set an expected return date.</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                    <BlogArticleProse>
                        <Trans>
                            If part of an older debt has already been paid back, enter that part in the &ldquo;Already returned&rdquo; field
                            (&ldquo;Already repaid&rdquo; for money you borrowed) and Budgie starts from the real remainder.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Step 2: show where the money came from</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            The same form has a &ldquo;From account&rdquo; field (&ldquo;To account&rdquo; for a borrowed debt). Choose the
                            card or cash wallet the money actually left or arrived in, and Budgie records a real expense or income on it,
                            filed under the Lending or Borrowing category. Your balance stays correct, and that month&rsquo;s statistics
                            show exactly where the money went.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            Leave the field empty and the debt stays a plain record with no transaction behind it. That suits old debts
                            whose money moved before you started using the app.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            Already received a loan and it shows up as an ordinary income? Long-press that income in the transaction list,
                            choose &ldquo;Attach debt&rdquo; and then &ldquo;New borrowed debt&rdquo;. Budgie creates the debt for that
                            amount and links the income to it in one step.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Step 3: attach repayments as they arrive</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            When a friend sends part of the money back, it lands in your account as ordinary income. You do not need to
                            enter it twice: long-press that transaction in the list and choose &ldquo;Attach debt&rdquo;, then pick the debt
                            it belongs to.
                        </Trans>
                    </BlogArticleProse>
                    <FeaturePageMedia>
                        <AppShot
                            alt={t(
                                i18n
                            )`Budgie transaction list with a long-press menu open on a transaction, showing the Attach debt action`}
                            locale={lang}
                            scene="transaction-long-press-menu-1"
                            sizes="(min-width: 768px) 19rem, 17rem"
                            slug="transaction-long-press-menu"
                        />
                    </FeaturePageMedia>
                    <BlogArticleProse>
                        <Trans>
                            The same action sits in the menu on the transaction&rsquo;s own screen. The picker lists only your debts, each
                            with its total, so it is hard to pick the wrong one.
                        </Trans>
                    </BlogArticleProse>
                    <FeaturePageMedia>
                        <AppShot
                            alt={t(i18n)`Budgie income transaction screen with a debt picker listing a lent debt and a borrowed debt`}
                            locale={lang}
                            scene="debt-tracking-3"
                            sizes="(min-width: 768px) 19rem, 17rem"
                            slug="debt-tracking"
                        />
                    </FeaturePageMedia>
                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                For money you lent, an attached income is a repayment, and an attached expense means you lent a bit more.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                For money you borrowed it is the other way round: an expense is a repayment, an income means you borrowed
                                more.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                A transaction without a category gets Lending or Borrowing automatically; a category you already chose
                                stays.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Attached the wrong one? Choose &ldquo;Detach debt&rdquo; on the transaction screen.</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Step 4: see how much is left</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Open a debt and the big number at the top is what is still due: &ldquo;To receive&rdquo; for money you lent,
                            &ldquo;To repay&rdquo; for money you borrowed. Next to it is the share already settled in percent, and below are
                            two lines: how much has come back and how much was lent or borrowed in total. Underneath you see every
                            transaction linked to this debt.
                        </Trans>
                    </BlogArticleProse>
                    <FeaturePageMedia>
                        <AppShot
                            alt={t(
                                i18n
                            )`Budgie debt screen showing the amount still to receive, the percentage returned, and the returned and lent totals`}
                            locale={lang}
                            scene="debt-tracking-2"
                            sizes="(min-width: 768px) 19rem, 17rem"
                            slug="debt-tracking"
                        />
                    </FeaturePageMedia>
                    <BlogArticleProse>
                        <Trans>
                            If more comes back than was owed, the debt does not go negative. The remainder stops at zero and a separate
                            &ldquo;Overpaid&rdquo; line shows the extra, so you can settle up with a clear figure.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Who owes whom, right on Home</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Home groups debts into two sections: &ldquo;You owe&rdquo; and &ldquo;Owed to you&rdquo;, each with its own
                            subtotal. Every card shows the remainder out of the total, a progress bar and the percent settled. When a return
                            date is less than a month away, the card counts down the days, and an overdue debt turns red.
                        </Trans>
                    </BlogArticleProse>
                    <FeaturePageMedia>
                        <AppShot
                            alt={t(
                                i18n
                            )`Budgie home screen with the You owe and Owed to you debt sections, each with a subtotal and progress`}
                            locale={lang}
                            scene="debt-tracking-1"
                            sizes="(min-width: 768px) 19rem, 17rem"
                            slug="debt-tracking"
                        />
                    </FeaturePageMedia>
                    <BlogArticleProse>
                        <Trans>
                            Purchases you pay off in parts also appear under &ldquo;You owe&rdquo;. They have their own payment schedule,
                            covered in{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/installment-tracking`}>
                                installment tracking
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>When the debt is paid off</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Once the last repayment is attached, the debt screen switches to a paid-off view: a green check,
                            &ldquo;Returned&rdquo; or &ldquo;Repaid&rdquo; as the headline, the amount paid back and the total. The debt
                            then disappears from Home on its own, so settled loans do not clutter the list.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            The same screen has an &ldquo;Archive&rdquo; button. An archived debt also drops out of account pickers and
                            totals, keeps its history, and waits under Settings &rarr; Archived Accounts, where you can restore it. More on
                            this in{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/account-management`}>
                                account management
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Debts and your net worth</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            A new debt is left out of your net worth by default. Turn on &ldquo;Include in Net Worth&rdquo; on the debt and
                            the remainder counts: money owed to you adds to it, money you owe subtracts from it. As repayments come in, the
                            effect shrinks until it reaches zero.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            Everything else about debts, from contacts to debts in another currency, is on the{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/debt-tracking`}>
                                debt and loan tracking
                            </Link>{' '}
                            page.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Frequently Asked Questions</Trans>
                    </BlogArticleHeading>

                    <BlogFaqSection locale={lang}>
                        <BlogFaqItem question={<Trans>Does the person who owes me need Budgie too?</Trans>}>
                            <Trans>
                                No. A debt is your own record. The contact you pick is just a name from your phone so you can see who the
                                debt is with; nothing is sent to that person.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Do lending and repayments distort my monthly spending?</Trans>}>
                            <Trans>
                                They count as real money movements: lending is an expense in the month you gave the money, a repayment is
                                income in the month it came back. Both are filed under Lending or Borrowing, so you can tell them apart from
                                everyday spending.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Can I track a debt from years ago?</Trans>}>
                            <Trans>
                                Yes. Create the debt without choosing an account: enter the total and what has already come back, and Budgie
                                tracks only the remainder, without inventing past transactions.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Will the app remind me about the return date?</Trans>}>
                            <Trans>
                                There are no push reminders. The date shows on the debt card instead: within the last month it counts down
                                the days, and once it passes the card shows how many days the debt is overdue.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>What happens if they return more than they owed?</Trans>}>
                            <Trans>
                                The remainder stops at zero, the debt counts as settled, and a separate &ldquo;Overpaid&rdquo; line shows
                                the extra amount.
                            </Trans>
                        </BlogFaqItem>
                    </BlogFaqSection>
                </BlogArticleSection>
            </BlogArticleContent>
        </BlogArticlePageShell>
    );
}
