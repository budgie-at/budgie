/* eslint-disable max-lines-per-function -- changelog keeps its month sections inline */
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
