/* eslint-disable max-lines-per-function -- changelog keeps its month sections inline */
/* eslint-disable max-lines -- changelog keeps its month sections inline */
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import { BlogArticleContent } from '../../../blog/component/blog-article-content/blog-article-content';
import { BlogArticleCta } from '../../../blog/component/blog-article-cta/blog-article-cta';
import { BlogArticleHeading } from '../../../blog/component/blog-article-heading/blog-article-heading';
import { BlogArticleListItem } from '../../../blog/component/blog-article-list-item/blog-article-list-item';
import { BlogArticleList } from '../../../blog/component/blog-article-list/blog-article-list';
import { BlogArticleProse } from '../../../blog/component/blog-article-prose/blog-article-prose';
import { BlogArticleSection } from '../../../blog/component/blog-article-section/blog-article-section';
import { BlogArticleSubheading } from '../../../blog/component/blog-article-subheading/blog-article-subheading';
import { BlogBreadcrumbCurrent } from '../../../blog/component/blog-breadcrumb-current/blog-breadcrumb-current';
import { BlogBreadcrumbLink } from '../../../blog/component/blog-breadcrumb-link/blog-breadcrumb-link';
import { BlogBreadcrumbs } from '../../../blog/component/blog-breadcrumbs/blog-breadcrumbs';
import { BreadcrumbsJsonLd } from '../../../generic/component/breadcrumbs-json-ld/breadcrumbs-json-ld';
import { Motion } from '../../../generic/component/motion/motion';
import { WebPageJsonLd } from '../../../generic/component/web-page-json-ld/web-page-json-ld';
import { buildPageMetadata } from '../../../generic/utils/build-page-metadata.util';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../i18n/init-lingui';

import { CHANGELOG_METADATA } from './metadata';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildPageMetadata({
        description: i18n._(CHANGELOG_METADATA.description),
        keywords: CHANGELOG_METADATA.keywords,
        locale: lang,
        path: `/${CHANGELOG_METADATA.slug}`,
        title: i18n._(CHANGELOG_METADATA.title)
    });
}

export default async function ChangelogPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);
    const path = `/${CHANGELOG_METADATA.slug}`;
    const title = i18n._(CHANGELOG_METADATA.title);

    return (
        <main className="flex-1">
            <BreadcrumbsJsonLd locale={lang} path={path}>
                <BreadcrumbsJsonLd.Item name={i18n._(msg`Home`)} path={`/${lang}`} />
                <BreadcrumbsJsonLd.Item name={title} path={`/${lang}${path}`} />
            </BreadcrumbsJsonLd>
            <WebPageJsonLd
                description={i18n._(CHANGELOG_METADATA.description)}
                locale={lang}
                path={path}
                publishedAt={CHANGELOG_METADATA.publishedAt}
                title={title}
                updatedAt={CHANGELOG_METADATA.updatedAt}
            />

            <section className="w-full py-20 md:py-32">
                <div className="container px-4 md:px-6 max-w-4xl">
                    <Motion>
                        <BlogBreadcrumbs>
                            <BlogBreadcrumbLink href={`/${lang}`} position={1}>
                                <Trans>Home</Trans>
                            </BlogBreadcrumbLink>
                            <BlogBreadcrumbCurrent position={2}>
                                <Trans>Changelog</Trans>
                            </BlogBreadcrumbCurrent>
                        </BlogBreadcrumbs>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                            <Trans>Budgie Changelog: What&rsquo;s New in the App</Trans>
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground">
                            <Trans>
                                What changed in Budgie, month by month, newest first. Only what you can see and use in the app, with no
                                marketing gloss.
                            </Trans>
                        </p>
                    </Motion>
                </div>
            </section>

            <BlogArticleContent>
                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>November 2026</Trans>
                    </BlogArticleHeading>

                    <BlogArticleSubheading>
                        <Trans>Budgets: periods, income-aware limits, sinking funds</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Budgets are no longer a single fixed monthly limit. A budget can run weekly, biweekly, monthly or yearly, and
                            existing budgets stay monthly. Under &ldquo;Limit from&rdquo; you can choose a fixed amount, the income received
                            this period, or the income you expect, which comes from your recurring income. An allocation block shows money
                            that is unassigned or over-assigned.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                Set aside holds named targets with a due date, one-off or repeating, and can be pre-filled from a yearly
                                recurring charge. Each period Budgie reserves what is still missing, and when the real expense posts near
                                the due date the fund pays it instead of the budget.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Event budgets pair a tag with a date range, such as a trip, with their own limit and optional category
                                limits. Tagged spending still counts in the main budget too.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Auto-tune moves category limits by at most 10% after three closed periods that were all under 80% or all
                                over the limit. Every change is listed under &ldquo;Limit changes&rdquo;, and tuning can be switched off per
                                budget.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                    <BlogArticleProse>
                        <Trans>
                            See{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/budget-planning`}>
                                budget planning
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleSubheading>
                        <Trans>Recurring payments: manual series and quiet corrections</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Detected recurring payments now carry a confidence score. Confident ones count straight away in the calendar and
                            in budget forecasts; low-confidence ones sit in a collapsed &ldquo;Possible&rdquo; section and do not count. You
                            can correct detection without any approval step: mark a series as not recurring or delete it with an undo toast,
                            mark a possible one as recurring, edit its title or schedule, or exclude a single transaction from a series.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            You can also create a recurring payment yourself, with amount, category, cadence, next date, an end condition
                            and an optional reminder, or turn an existing expense or income into one with &ldquo;Make recurring&rdquo;.
                            Manual series are plans: Budgie forecasts and matches them against real transactions but never posts
                            transactions for you. The Recurring pane has a list and a calendar view, a summary of what is committed per
                            month, and a detail screen per series. Reminders are off by default and ask for notification permission only
                            when you turn one on. See{' '}
                            <Link
                                className="font-semibold underline underline-offset-4"
                                href={`/${lang}/features/recurring-payments-calendar`}
                            >
                                recurring payments
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleSubheading>
                        <Trans>Bank sync and imports</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                Banks across the EU, such as Trade Republic and N26, sync on the device through your own Enable Banking
                                application. There is no Budgie server in between and Budgie holds no credential. Connecting to a bank can
                                continue an existing account, keeping its history and syncing forward from its last transaction. Banks now
                                show their logos.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                The Inzhur operations export (XLSX) can be imported as the full ledger of your Inzhur cash account,
                                including buys, sells, dividends and tax, so fund pages can show return on what you paid. The holdings PDF
                                stays optional.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Tapping a bank on Home opens that bank&rsquo;s page with its total, sync status, accounts and all of its
                                transactions, instead of its settings.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                    <BlogArticleProse>
                        <Trans>
                            See{' '}
                            <Link
                                className="font-semibold underline underline-offset-4"
                                href={`/${lang}/features/bank-integration-management`}
                            >
                                bank integration management
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleSubheading>
                        <Trans>Pay in parts</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            A pay-in-parts conversion can be undone: the plan-created toast has an Undo action, and a plan account has an
                            &ldquo;Undo pay in parts&rdquo; action that removes the plan and puts the original transaction back. Parts paid
                            early, twice, or in multiples are now matched to the plan. See{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/installment-tracking`}>
                                installment tracking
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleSubheading>
                        <Trans>Import and backups</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                CSV import maps columns automatically, and amounts are parsed strictly: a value that is ambiguous or
                                malformed fails that row instead of being silently truncated or guessed. See{' '}
                                <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/csv-import`}>
                                    CSV import
                                </Link>
                                .
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Backups are smaller. Exchange-rate history and AI embeddings are stored more compactly, and the database is
                                compacted after updates. See{' '}
                                <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/database-backup`}>
                                    database backup
                                </Link>
                                .
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                    <BlogArticleSubheading>
                        <Trans>Look and feel</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Home, Settings, account forms, rules, categories and tags, budgets, recurring payments, transaction forms and
                            the categorize inbox were rebuilt as grouped lists with a consistent look. Home shows your net worth with an
                            asset mix bar and a card for cash, and linked banks appear as one card with their own logo. Settings moves data
                            tools onto their own screen. The Runway tab reads as one screen with labelled charts, and its monthly burn trims
                            one-off spikes.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>October 2026</Trans>
                    </BlogArticleHeading>

                    <BlogArticleSubheading>
                        <Trans>Receipt scanning (iOS)</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            On iOS you can scan a receipt with the camera, choose photos or PDFs from Photos or Files, or share them into
                            Budgie. Reading happens on the device and nothing leaves it. Every scan ends in a prefilled form that you
                            confirm: it either attaches the receipt to the transaction it matches, or creates a new expense, and a receipt
                            you have already scanned is recognised as a duplicate.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleSubheading>
                        <Trans>Pay in parts</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            An expense for the first part of a bank installment purchase can be turned into an installment plan from its
                            menu. Later parts attach to the plan and keep their own categories. The sheet takes any number of months from 2
                            to 120 and shows the monthly payment, the plan total and an optional fee. See{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/installment-tracking`}>
                                installment tracking
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleSubheading>
                        <Trans>Bank sync</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                On iOS the history import keeps running in the background, and each bank&rsquo;s section on Home shows an
                                inline progress row with an estimated time left.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                After a Monobank sync catches up, balances are compared with the bank&rsquo;s own balance and a single
                                adjustment keeps them aligned.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                External accounts: income received on an account Budgie does not track, such as a business card, can be
                                counted as income instead of as an own-card transfer. Reissued cards are merged into the original account,
                                and quick import now picks up cards that had no account yet.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Withdrawals at an ATM are moved to your cash account automatically, for any bank, when there is a single
                                active cash account in the same currency. Transfers tagged as money transfers are no longer filed as bank
                                fees.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Synced copies of expenses you had added by hand are merged with them, so the overlap is not counted twice,
                                and more refunds are matched automatically, including foreign-currency ones.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Binance: several API keys can coexist, Spot and Funding transfers are synced, and balances match the
                                exchange. See{' '}
                                <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/binance-sync`}>
                                    Binance sync
                                </Link>
                                .
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                    <BlogArticleSubheading>
                        <Trans>Categorization and rules</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                Create rule appears in the transaction actions menu, with conditions, category and tags already filled in.
                                See{' '}
                                <Link
                                    className="font-semibold underline underline-offset-4"
                                    href={`/${lang}/features/categorization-rules`}
                                >
                                    categorization rules
                                </Link>
                                .
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Categorize inbox rows open the transaction, and the inbox became a list-first flow with stable groups.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Category suggestions use a new on-device embeddings model. After the update, Budgie re-embeds your history
                                once and removes the old model download.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                    <BlogArticleSubheading>
                        <Trans>Security and backups</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                Wrong PINs lock the keypad for a growing wait, starting with 30 seconds after five wrong tries. Face ID
                                still works during a wait. See{' '}
                                <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/pin-app-lock`}>
                                    PIN app lock
                                </Link>
                                .
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Onboarding is rebuilt around choosing your key: a PIN or the phone lock only, or restoring a backup. Forgot
                                PIN and add PIN later are sheets, and Settings shows your database file and when it was last backed up.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Backups are exported as a zip file. Import accepts both zip and the older .db files. See{' '}
                                <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/database-backup`}>
                                    database backup
                                </Link>
                                .
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                    <BlogArticleSubheading>
                        <Trans>Debts and deposits</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Each debt is its own card with a progress ring, red when you owe and green when you are owed. A debt that is
                            fully paid off is hidden from Home and shows a paid-off screen. Deposits opened from a synced expense start in
                            the currency of the original operation. See{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/debt-tracking`}>
                                debt &amp; loan tracking
                            </Link>{' '}
                            and{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/deposit-tracking`}>
                                deposit tracking
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleSubheading>
                        <Trans>Look and feel</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Home account tiles lead with the balance, the account details screen collapses into the navigation bar, and
                            transaction lists share one grouped look across history, pickers and recurring payments. Amounts show the minus
                            sign before the currency symbol. The app also starts faster, and the installed app is smaller.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>September 2026</Trans>
                    </BlogArticleHeading>

                    <BlogArticleSubheading>
                        <Trans>Runway: one verdict instead of a dashboard</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            The home screen shows a Runway pill next to your total balance, a short read like &ldquo;+$420 / mo&rdquo; or
                            &ldquo;≈ 4 mo&rdquo; that tells you whether you are growing or burning through savings. Tapping it opens the
                            Runway tab, which leads with one verdict card: growing or burning, how many months of cover you have or what you
                            net per month, and a run-out date when you are burning.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            Two switches in Settings control it: &ldquo;Show on home&rdquo; toggles the pill (on by default) and
                            &ldquo;Include crypto&rdquo; counts your crypto at today&rsquo;s market value (off by default).
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>On-device AI: lighter, and easy to turn off</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Settings has a plain on-device AI switch, so turning categorization and voice entry off or back on no longer
                            means going through onboarding again. AI models now load only when a feature needs them and are released shortly
                            after you stop using them, instead of loading every time you open the app. Installs that predate on-device AI
                            got it back after an update had left it off.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Recurring payments</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Detection follows each bill&rsquo;s real rhythm, so bi-monthly and quarterly payments are recognized alongside
                            monthly ones.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Unlock and backup restore</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                Phones with a fingerprint sensor and no face scanner are now offered biometric unlock, and the lock screen
                                shows a fingerprint icon on them.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Restoring a PIN-protected backup asks for that backup&rsquo;s PIN, and that PIN becomes your app PIN, so the
                                restored data stays readable.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleSubheading>
                        <Trans>Imports and transfers</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Transfers between your own PrivatBank cards are paired and classified as transfers instead of sitting around as
                            two unrelated entries. The PrivatBank import instructions now match the real Privat24 flow: export the statement
                            as Excel, and treat it as a one-time import rather than a live sync. See{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/account-transfers`}>
                                account transfers
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Smaller fixes</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                The split screen&rsquo;s &ldquo;left to assign&rdquo; footer no longer gets stuck on a fraction of a cent,
                                so the confirm button appears when the amounts add up. See{' '}
                                <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/split-transactions`}>
                                    split transactions
                                </Link>
                                .
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Transferring money to or from a debt account keeps the category you had instead of replacing it with a
                                generic transfer category. See{' '}
                                <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/debt-tracking`}>
                                    debt &amp; loan tracking
                                </Link>
                                .
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                    <BlogArticleSubheading>
                        <Trans>Categorize inbox and icons</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            The uncategorized pill opens a Categorize inbox that groups every uncategorized transaction by merchant, so a
                            whole group can be categorized at once. Suggestions come from your own history on the device, and groups with no
                            history ask you to pick a category instead of guessing. A tag inbox does the same for untagged transactions, and
                            creating a rule from the inbox no longer freezes the app. ATM withdrawals form their own cash group. See{' '}
                            <Link
                                className="font-semibold underline underline-offset-4"
                                href={`/${lang}/features/bulk-categorize-transactions`}
                            >
                                bulk categorize transactions
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            Category icon search matches titles in several languages, including Ukrainian, German, Spanish and French, and
                            emoji can be used as icons.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>August 2026</Trans>
                    </BlogArticleHeading>

                    <BlogArticleSubheading>
                        <Trans>Bank connections</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Each bank connection has its own settings page where you can add more accounts from an already-connected bank,
                            and the home screen groups synced accounts by connection instead of listing them all flat. See{' '}
                            <Link
                                className="font-semibold underline underline-offset-4"
                                href={`/${lang}/features/bank-integration-management`}
                            >
                                bank integration management
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Binance sync</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Binance accounts sync directly, including P2P trades matched against your bank transactions so a P2P purchase
                            and its bank transfer are not counted as two expenses. Coins held on the exchange stay in the exchange section.
                            See{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/binance-sync`}>
                                Binance sync
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Deposits</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Fixed-term deposits are their own account type with an interest rate, and a Close Deposit action that moves the
                            balance to an account you choose. See{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/deposit-tracking`}>
                                deposit tracking
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Debts</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Debts are tracked as their own account type, with progress shown on each debt and a consistent balance
                            everywhere it appears. See{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/debt-tracking`}>
                                debt &amp; loan tracking
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Transactions</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            The transactions list can be filtered by amount range as well as by date, category, tag, and account. Opening a
                            transaction shows month-by-month bars of similar spending, so you can see whether an amount is typical for that
                            merchant or category.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Look and feel</Trans>
                    </BlogArticleSubheading>
                    <BlogArticleProse>
                        <Trans>
                            Screens have a header that blurs the content behind it and collapses as you scroll, giving lists more room.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>
            </BlogArticleContent>

            <BlogArticleCta locale={lang} />
        </main>
    );
}
