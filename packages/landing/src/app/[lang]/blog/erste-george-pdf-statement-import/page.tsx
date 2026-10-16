/* eslint-disable max-lines, max-lines-per-function */
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
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';
import { Badge } from '../../../../ui/badge';

import { ARTICLE_METADATA } from './metadata';

export const generateMetadata = createBlogGenerateMetadata(ARTICLE_METADATA);

export default async function ErsteGeorgePdfStatementImportPage(props: PageLangParam) {
    const { lang } = await props.params;
    initLingui(lang);

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
                        <Trans>Import an Erste George PDF Statement into Budgie</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>Import an Erste George PDF Statement into Budgie</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>
                        How to download an Erste Bank statement as a PDF in George and import it into Budgie: the steps in George, what
                        carries over, and how to add new statements later.
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
                                <Trans>erste</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>george</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>pdf</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>import</Trans>
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
                    <BlogArticleProse>
                        <Trans>
                            George keeps every statement of your Erste Bank account as a PDF. Budgie reads that PDF on your phone and turns
                            it into an account with every booking, its date and amount, so your household book stays complete without typing
                            a single line. Below is the whole route: downloading the statement in George, importing it into Budgie, and
                            adding newer statements later.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            This is an import from a file, not a live connection to the bank. When you want newer bookings, download the
                            next statement and import it the same way: anything already in Budgie is skipped. The feature itself is
                            described on the{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/erste-bank-pdf-import`}>
                                Erste Bank PDF import
                            </Link>{' '}
                            page.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>What you need</Trans>
                    </BlogArticleHeading>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>A euro current account at Erste Bank in Austria, with access to George in the browser or the app.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Budgie on your phone. You do not need a Budgie account, and Budgie never asks for your George login.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Step 1. Download the statement from George as a PDF</Trans>
                    </BlogArticleHeading>

                    <BlogArticleList ordered>
                        <BlogArticleListItem>
                            <Trans>Sign in to George and open the account you want to bring into Budgie.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Open its statements. In George in the browser, the account has a Kontoauszüge (statements) button; in the
                                George app, tap Funktionen (functions) and then Kontoauszüge.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Pick a statement from the list and download it as a PDF. If George offers several layouts, take the regular
                                A4 statement.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Save the file to your phone. If you downloaded it on a computer, send it to your phone and save it to your
                                files.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            Each statement covers the period since the previous one, so one file rarely holds your whole history. For the
                            first import, take the oldest statements you need as well: Budgie builds the account balance from the bookings
                            it imports, so missing periods leave a balance that does not match the bank. According to George&apos;s own
                            help, past statements can be downloaded for up to three years back. Overlapping files are fine, because Budgie
                            skips bookings it already has.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Step 2. Import the PDF into Budgie</Trans>
                    </BlogArticleHeading>

                    <BlogArticleList ordered>
                        <BlogArticleListItem>
                            <Trans>In Budgie, tap the + button in the tab bar and choose Account.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Under Account Sync, choose Erste Bank. Budgie shows the same George steps as a short reminder.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Tap Select File and pick the PDF statement you saved.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Budgie lists the account it found in the file, with its IBAN. Switch it on, or tap Select all.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Tap Start Sync. Budgie creates an account called Erste EUR, fills it with the bookings and takes you back to
                                the home screen.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            If you already keep an account in Budgie with the same IBAN, the bookings go into that account instead of a new
                            one. The PDF is read on your phone: the statement is not uploaded anywhere, and the bookings are stored only on
                            your device.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>What Budgie takes from the statement</Trans>
                    </BlogArticleHeading>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Date</strong>: one date per booking, as printed on the statement. The PDF carries no time of day.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Booking text</strong>, which becomes the transaction title.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Amount</strong>, recorded as an expense or as income depending on its sign, always in euros.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Place</strong>: for card payments, the city and country from the booking text are kept as a note.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>IBAN</strong>: stored on the account, so the next statement lands in the same place.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Cash withdrawals</strong>: ATM withdrawals are recognized as such. If you keep exactly one cash
                                account in euros, Budgie records them as transfers into it; otherwise they wait together in the Categorize
                                inbox.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            The statement carries no categories, so the other bookings arrive uncategorized. Your own categorization rules
                            run on them, and whatever is left waits in the Categorize inbox, grouped by merchant. If you also hold money in
                            other currencies, keep it in separate accounts:{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/multi-currency`}>
                                multi-currency tracking
                            </Link>{' '}
                            brings everything together in your main currency.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Adding new statements later</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Once the account is in Budgie, you do not need to repeat the setup. Download the next statement from George,
                            then long-press the Erste account card on Budgie&apos;s home screen. The file picker opens straight away: pick
                            the new PDF and Budgie imports it in the background.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            When it finishes, Budgie shows how many bookings were new, how many were already imported and how many it
                            checked. Nothing is doubled, so you can import the same statement twice without harm.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>If the import does not work</Trans>
                    </BlogArticleHeading>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Budgie reports an invalid file.</strong> Make sure the PDF is an account statement from Erste Bank
                                in Austria, downloaded from George, and not a statement from another bank.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>The balance differs from the bank.</strong> Some statements are probably missing. Import the earlier
                                ones as well; bookings you already have are skipped.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>The long-press reports no matching accounts.</strong> The file belongs to an account you have not
                                added yet. Add it once through Step 2.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>A statement from another bank.</strong> Use{' '}
                                <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/csv-import`}>
                                    CSV import
                                </Link>
                                , where you match the file&apos;s columns to Budgie fields yourself.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Frequently Asked Questions</Trans>
                    </BlogArticleHeading>

                    <BlogFaqSection locale={lang}>
                        <BlogFaqItem question={<Trans>Which Erste accounts can I import?</Trans>}>
                            <Trans>
                                Euro accounts at Erste Bank in Austria, from the PDF statement you download in George. One statement covers
                                one account.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Will importing the same statement twice create duplicates?</Trans>}>
                            <Trans>
                                No. Budgie recognizes bookings it has already imported and skips them, so overlapping statements are safe.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Is my statement sent to a server?</Trans>}>
                            <Trans>
                                No. Budgie reads the PDF on your phone and keeps the bookings there. The statement is never uploaded.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Does Budgie sync with George automatically?</Trans>}>
                            <Trans>
                                No. Erste import works from the PDF statement. To add new bookings, download the next statement and
                                long-press the account card in Budgie.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Do I need to enter my George login in Budgie?</Trans>}>
                            <Trans>
                                No. You sign in to George yourself to download the statement. Budgie only sees the PDF you choose.
                            </Trans>
                        </BlogFaqItem>
                    </BlogFaqSection>
                </BlogArticleSection>
            </BlogArticleContent>
        </BlogArticlePageShell>
    );
}
