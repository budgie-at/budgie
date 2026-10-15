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
import { AppShot } from '../../../../generic/component/app-shot/app-shot';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';
import { Badge } from '../../../../ui/badge';

import { ARTICLE_METADATA } from './metadata';

export const generateMetadata = createBlogGenerateMetadata(ARTICLE_METADATA);

export default async function PayInPartsPurchasesArticle(props: PageLangParam) {
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
                        <Trans>Pay-in-parts purchases</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>How to keep track of pay-in-parts purchases from Monobank and PrivatBank</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>
                        A phone bought in parts shows up in your statement one payment at a time, and the rest of the debt is easy to
                        forget. Turn the purchase into a plan in Budgie once, and you always see how many payments are left and when the
                        next one is due.
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
                                <Trans>installments</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>monobank</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>privatbank</Trans>
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
                        <Trans>How paying in parts works at the bank</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            With Monobank Pay in parts, the store splits the price into up to 24 payments. The first payment is taken right
                            away when you buy, and the rest are taken from your card automatically on the same date every month. If you keep
                            the number of payments the store offers, there is no fee; adding more payments costs extra.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            With PrivatBank Pay in parts, the store sets the number of payments as well. For online purchases at the
                            bank&rsquo;s partner stores you can stretch the term yourself, up to twice the number of payments the store
                            offers and no more than 25, for a fee for every extra month.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            Either way, your statement only ever shows the payment that has just been taken. How much is still left, how
                            many payments remain and when the last one is due stay out of sight, unless you keep track of them somewhere.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>One thing to know first: you create the plan yourself</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Budgie does not recognise pay-in-parts purchases by itself. Your bank&rsquo;s first payment arrives as an
                            ordinary expense, and it stays one until you turn it into a plan. You do that once per purchase, by hand, and it
                            takes a few taps. From then on Budgie follows the monthly payments for you.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Step by step: turn a purchase into a plan</Trans>
                    </BlogArticleHeading>

                    <BlogArticleSubheading>
                        <Trans>1. Find the first payment</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Open your transactions and find the expense for the first payment, dated the day you made the purchase. It can
                            come from{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/monobank-sync`}>
                                Monobank sync
                            </Link>
                            , from an imported{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/privatbank-import`}>
                                PrivatBank statement
                            </Link>{' '}
                            or from an entry you added yourself.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>2. Long-press it and choose Pay in parts</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Press and hold the expense in the list to open the{' '}
                            <Link
                                className="font-semibold underline underline-offset-4"
                                href={`/${lang}/features/transaction-long-press-menu`}
                            >
                                long-press menu
                            </Link>{' '}
                            and choose Pay in parts. The same option is in the menu at the top of the transaction screen. It appears for an
                            expense with a single category that is not yet linked to a debt and not merged into another transaction.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>3. Pick the number of payments</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Choose 2, 3, 4, 6, 10, 12 or 24 payments; three are selected to begin with. Budgie treats your expense as one
                            payment and multiplies it, so the plan total and the size of each payment update as you tap. Under the choice, a
                            timeline shows the month of the first and the last payment.
                        </Trans>
                    </BlogArticleProse>

                    <figure className="mx-auto my-4 w-full max-w-[18rem]">
                        <AppShot
                            alt={t(i18n)`Budgie Pay in parts sheet with three payments selected, the plan total and the payment timeline`}
                            locale={lang}
                            scene="installment-tracking-1"
                            sizes="18rem"
                            slug="installment-tracking"
                        />
                        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
                            <Trans>The Pay in parts sheet: number of payments, total, timeline and fee.</Trans>
                        </figcaption>
                    </figure>

                    <BlogArticleSubheading>
                        <Trans>4. Check the total and the fee</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            If the bank quoted a different total, for example because you added payments for a fee, tap the total and type
                            the amount from the bank. Budgie then shows the approximate size of each payment. Tap Fee 0% and enter the
                            bank&rsquo;s fee in percent to see how much of that total is the fee. The plan always follows the total you
                            entered.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>5. Name the plan and create it</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            The plan takes the name of the purchase; tap it to rename the plan, for example to the item you bought. Tap
                            Create plan, and Budgie opens the new plan straight away.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>What you see after that</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            The plan screen shows what is left to pay, how much you have already paid, the total and the share already
                            repaid. Below it, a line such as 2 of 3 paid gives the amount and date of the next payment, followed by every
                            payment attached to the plan.
                        </Trans>
                    </BlogArticleProse>

                    <figure className="mx-auto my-4 w-full max-w-[18rem]">
                        <AppShot
                            alt={t(
                                i18n
                            )`Budgie installment plan screen with the amount left to pay, two of three payments paid and the next payment`}
                            locale={lang}
                            scene="installment-tracking-2"
                            sizes="18rem"
                            slug="installment-tracking"
                        />
                        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
                            <Trans>The plan screen: left to pay, paid so far and the next payment.</Trans>
                        </figcaption>
                    </figure>

                    <BlogArticleProse>
                        <Trans>
                            On Home, every open plan sits under You owe, next to your other{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/debt-tracking`}>
                                debts
                            </Link>
                            . The card shows the next payment with its date and how much is left out of the total.
                        </Trans>
                    </BlogArticleProse>

                    <figure className="mx-auto my-4 w-full max-w-[18rem]">
                        <AppShot
                            alt={t(i18n)`Budgie Home screen with an installment plan under You owe showing the next payment`}
                            locale={lang}
                            scene="installment-tracking-3"
                            sizes="18rem"
                            slug="installment-tracking"
                        />
                        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
                            <Trans>Open plans on Home, under You owe.</Trans>
                        </figcaption>
                    </figure>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>How the monthly payments find their plan</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            After each Monobank sync or statement import, Budgie checks every open plan. The next payment is due on the same
                            day of the month as the first one. Budgie looks on the same account for an expense within three days of that
                            date, with the amount of the next payment and the same name as the first one; for Monobank, Budgie recognises
                            the bank&rsquo;s own monthly payment entries. When exactly one expense fits, it is added to the plan. When
                            several could fit, Budgie leaves them alone rather than guess.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>A payment was not picked up.</strong> Long-press it, choose Attach debt and select the plan. Do the
                                same for payments you add by hand.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>You created the plan late.</strong> If you convert a later payment, Budgie looks back for the
                                earlier ones on the same account, a month apart and with the same amount, and adds them to the plan too.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>You paid it off early in Monobank.</strong> The bank&rsquo;s early repayment for the remaining
                                amount is attached to the plan, and the plan is paid off.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>You returned the item.</strong> Once the refund is linked to the purchase, Budgie closes the plan at
                                what you have already paid.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>The terms changed.</strong> Edit the plan to change its name, total or number of payments; the
                                number cannot drop below the payments already made plus one.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>How budgets and analytics count a plan</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Creating a plan does not add the full price as one big expense. Each payment stays an ordinary expense in its
                            category, on the day it left your card. So your{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/budget-planning`}>
                                budget
                            </Link>{' '}
                            and spending statistics show what you really paid each month, not the whole phone in the month you bought it.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            The plan itself is a debt: it shows what you still owe and is not counted as spending. For more on how plans
                            work, see{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/installment-tracking`}>
                                installment tracking
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Frequently Asked Questions</Trans>
                    </BlogArticleHeading>

                    <BlogFaqSection locale={lang}>
                        <BlogFaqItem question={<Trans>Does Budgie detect pay-in-parts purchases automatically?</Trans>}>
                            <Trans>
                                No. You turn the purchase into a plan yourself with Pay in parts. After that, Budgie attaches the monthly
                                payments that match the plan.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Which expense should I turn into a plan?</Trans>}>
                            <Trans>
                                The first payment, the one taken on the day you bought the item. Budgie counts it as the first of the
                                payments and works out the total from it.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>What if the bank charges a fee?</Trans>}>
                            <Trans>
                                Type in the total the bank shows, fee included. Enter the fee in percent to see how much of the total it is;
                                the plan follows the total.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Will the full price land in my budget at once?</Trans>}>
                            <Trans>
                                No. Each payment counts in its category in the month it is paid. The plan only keeps score of what is paid
                                and what is left.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Does this work with other banks and stores?</Trans>}>
                            <Trans>
                                Yes. Any expense with a single category that is not already linked to a debt can become a plan, whether it
                                came from a bank or you entered it yourself.
                            </Trans>
                        </BlogFaqItem>
                    </BlogFaqSection>
                </BlogArticleSection>
            </BlogArticleContent>
        </BlogArticlePageShell>
    );
}
