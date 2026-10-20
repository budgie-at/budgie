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

export default async function MonobankApiTokenArticle(props: PageLangParam) {
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
                        <Trans>Monobank API token</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>How to get a Monobank token and connect it to your expense tracker</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>
                        One personal token from Monobank is all Budgie needs to bring in your cards, jars and transactions. Getting it and
                        pasting it in takes about two minutes; your history then keeps loading in the background.
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
                                <Trans>bank sync</Trans>
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
                        <Trans>Who this guide is for</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            You bank with Monobank, you want your spending in an expense tracker without typing every coffee by hand, and
                            you would rather not hand your banking login to a third-party service. Budgie connects to Monobank with a
                            personal token instead: you create it yourself on Monobank&rsquo;s own page and paste it into the app.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            Monobank opens this access only to customers aged 16 and over; data for children&rsquo;s cards is available
                            through the parent&rsquo;s access.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>What the token can and cannot do</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Monobank&rsquo;s personal token is meant for reading your own data: your list of cards and jars, their balances
                            and your statement. Monobank&rsquo;s personal access has no payment functions, so the token cannot send money or
                            change anything in your bank account.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            Budgie uses it for exactly two things: fetching your list of cards and jars with their balances, and fetching
                            the transactions for the accounts you choose.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Step by step</Trans>
                    </BlogArticleHeading>

                    <BlogArticleSubheading>
                        <Trans>1. Open the Monobank connection in Budgie</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Go to New Account and tap Monobank under Account Sync. If you are still setting up the app, the onboarding
                            offers the same Monobank connection. You land on the Connect Monobank screen.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>2. Get your personal token from Monobank</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                Tap Get API Token at the top of the screen. It opens Monobank&rsquo;s API page, api.monobank.ua, right
                                inside Budgie. You can also open that address in any browser.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Log in by scanning the QR code on that page with the Monobank app. A QR code is easiest to scan from a
                                second screen, so opening the page on a computer is often quicker.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Create your personal token on that page and copy it.</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleSubheading>
                        <Trans>3. Paste the token into Budgie</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Back on Connect Monobank, paste the token into the field at the bottom; the button next to the field pastes it
                            from your clipboard in one tap. The field hides the token as you type. Then tap Fetch Accounts.
                        </Trans>
                    </BlogArticleProse>

                    <figure className="mx-auto my-4 w-full max-w-[18rem]">
                        <AppShot
                            alt={t(
                                i18n
                            )`Budgie Connect Monobank screen with the Get API Token button, three setup steps and the token field`}
                            locale={lang}
                            scene="no-bank-login-budget-app-1"
                            sizes="18rem"
                            slug="no-bank-login-budget-app"
                        />
                        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
                            <Trans>The Connect Monobank screen: get the token at the top, paste it at the bottom.</Trans>
                        </figcaption>
                    </figure>

                    <BlogArticleSubheading>
                        <Trans>4. Pick your cards and jars</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            One token covers every card you have with Monobank. Budgie lists your cards first and your jars in their own
                            section below; tick the ones you want, or use Select all, then tap Continue.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>5. Choose how much history to load</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Monobank sends about one month of history per minute, for each account you selected, so the choice is a
                            trade-off between depth and waiting time:
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Last 1 month: about a minute.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Last 3 months: about 3 minutes. This is the default.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Last 6 months: about 6 minutes.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Last year: about 12 minutes.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Whole period: can take hours on an old account.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Do not sync history: nothing from the past is imported, only new transactions from now on.</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                    <BlogArticleProse>
                        <Trans>
                            The times are per account: three months for two cards is roughly six minutes. A year or the whole period keeps
                            loading in the background and goes much slower while the app is closed, so leaving Budgie open speeds it up.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>6. Tap Start Sync</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            That is the whole setup. Your cards and jars appear as accounts grouped under Monobank, each with its own
                            switch, and transactions start arriving.
                        </Trans>
                    </BlogArticleProse>

                    <figure className="mx-auto my-4 w-full max-w-[18rem]">
                        <AppShot
                            alt={t(i18n)`Monobank cards and a jar listed in Budgie with their balances and sync switches`}
                            locale={lang}
                            scene="monobank-sync-1"
                            sizes="18rem"
                            slug="monobank-sync"
                        />
                        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
                            <Trans>After setup: each card and jar is its own account, with a switch to pause it.</Trans>
                        </figcaption>
                    </figure>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>What happens after you connect</Trans>
                    </BlogArticleHeading>
                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                New transactions keep arriving in the background, including while you are not using the app, though more
                                slowly than with Budgie open.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Purchases arrive with the merchant category code your bank attaches, and Budgie uses it to put many of them
                                into a category straight away. See{' '}
                                <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/mcc-auto-category`}>
                                    automatic categories from merchant codes
                                </Link>
                                .
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                With real spending flowing in, a monthly budget stops being guesswork. See{' '}
                                <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/budget-planning`}>
                                    budget planning
                                </Link>
                                .
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Everything the connection does, from jars to transfers between your own cards, is described on the{' '}
                                <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/monobank-sync`}>
                                    Monobank sync
                                </Link>{' '}
                                page.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Where your token is kept</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            The token is saved in Budgie&rsquo;s database on your phone, and the app sends it only to Monobank: your phone
                            asks Monobank for your data directly. Budgie has no server of its own that sees your token or your transactions.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            Treat the token like a key to your statement: do not paste it into chats or share it with anyone. If you think
                            it has leaked, create a new one on Monobank&rsquo;s API page and update it in Budgie as described below.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Troubleshooting</Trans>
                    </BlogArticleHeading>

                    <BlogArticleSubheading>
                        <Trans>&ldquo;Sync Failed&rdquo; or the token stopped working</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            If Monobank keeps rejecting the token, Budgie retries a few times, then marks the account Sync Failed and turns
                            its sync off. Get a fresh token from Monobank, open the account&rsquo;s settings, tap Change next to API Token,
                            paste the new one and save. Then switch Sync back on.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>History is loading slowly</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            That is Monobank&rsquo;s limit, not a fault: its statement can be requested at most once a minute and covers up
                            to 31 days per request. Budgie waits out the pause and carries on by itself, so you do not need to tap anything.
                            Keeping the app open is the fastest way through a long history.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Some recent transactions look wrong or are missing</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Open the account&rsquo;s settings and re-sync a window: the last 7, 30 or 90 days, or the whole history. It
                            starts on the next sync. See{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/bank-resync-window`}>
                                re-sync window
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
                        <BlogFaqItem question={<Trans>Does Budgie need my Monobank login or card details?</Trans>}>
                            <Trans>
                                No. You log in to Monobank on Monobank&rsquo;s own page, and Budgie only ever receives the token you paste.
                                No card number, PIN or password is entered in Budgie.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Can someone move my money with this token?</Trans>}>
                            <Trans>
                                No. Monobank&rsquo;s personal access is for reading your cards, balances and statement; it has no payment
                                functions. Still, keep the token private, because it does reveal your transactions.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Do I need a separate token for each card?</Trans>}>
                            <Trans>
                                No. One token covers all your Monobank cards and jars. You choose which of them to bring into Budgie during
                                setup, and each one keeps its own sync switch.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>How much history should I pick?</Trans>}>
                            <Trans>
                                Three months, the default, loads in a few minutes per account and is enough to see your typical month before
                                you set a budget. Pick a year or the whole period for long-term statistics, if you do not mind it loading in
                                the background.
                            </Trans>
                        </BlogFaqItem>
                    </BlogFaqSection>
                </BlogArticleSection>
            </BlogArticleContent>
        </BlogArticlePageShell>
    );
}
