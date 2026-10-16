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

export default async function Privat24StatementExcelImportPage(props: PageLangParam) {
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
                        <Trans>Privat24 Statement in Excel: Export and Import</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>Privat24 Statement in Excel: Export and Import</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>
                        How to export a Privat24 card statement to Excel and import it into Budgie: the steps in Privat24, what carries
                        over, and how to add new operations later.
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
                                <Trans>privat24</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>excel</Trans>
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
                            Privat24 does not pass your transactions to budgeting apps on its own, but it lets you save a card statement as
                            an Excel file. Budgie reads that file on your phone and turns it into an account with every operation, its date,
                            category and amount. Below is the whole route: exporting the statement from Privat24, importing it into Budgie,
                            and topping it up later.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            This is a one-off import, not a live connection to the bank. When you want newer operations, export a fresh
                            statement and import it the same way: anything already in Budgie is skipped. The feature itself is described on
                            the{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/privatbank-import`}>
                                PrivatBank import
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
                            <Trans>The Privat24 app or website, signed in to your account.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Budgie on your phone. You do not need a Budgie account, and Budgie never asks for your Privat24 login.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Step 1. Export the statement from Privat24 to Excel</Trans>
                    </BlogArticleHeading>

                    <BlogArticleList ordered>
                        <BlogArticleListItem>
                            <Trans>Open Privat24 and choose the card or account you want to bring into Budgie.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Open its statement. PrivatBank&apos;s own help places it under My accounts, then Card statements.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Set the period. For the first import, start from the card&apos;s earliest operation: Budgie builds the
                                account balance from the operations it imports, so a shorter period leaves a balance that does not match the
                                bank.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Choose Excel as the format. Budgie accepts only the Excel statement from PrivatBank; the PDF and CSV
                                versions will not import.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Save the file to your phone. If Privat24 sends the statement to your email instead, open the email and save
                                the attachment to your files.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            One statement covers one card. If you have several PrivatBank cards, export a statement for each and import them
                            one after another. If Privat24 will not give you the whole period in one file, export consecutive periods:
                            overlapping dates are fine, because Budgie skips operations it already has.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Step 2. Import the file into Budgie</Trans>
                    </BlogArticleHeading>

                    <BlogArticleList ordered>
                        <BlogArticleListItem>
                            <Trans>In Budgie, tap the + button in the tab bar and choose Account.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Under Account Sync, choose Privatbank. Budgie shows the same export steps as a short reminder.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Tap Select File and pick the Excel statement you saved.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Budgie lists the cards it found in the file. Switch on the ones you want, or tap Select all.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Tap Import. Budgie creates an account named after the bank and the last four digits of the card, fills it
                                with the operations and takes you back to the home screen.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            The file is read on your phone. The statement is not uploaded anywhere, and the operations are stored only on
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
                                <strong>Date and time</strong> of every operation.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Description</strong>, which becomes the transaction title.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Amount</strong>, recorded as an expense or as income depending on its sign.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Category</strong>: Privat24&apos;s category is matched to a Budgie category. Operations whose
                                category has no match stay uncategorized, ready for you to sort.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Card</strong>: operations are grouped by card, so each card becomes its own account.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Currency</strong>: the account takes the card&apos;s currency, and a purchase in another currency
                                keeps the rate between the original and the charged amount.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Bank fees</strong>: when the card was charged more than the purchase itself in the same currency,
                                the difference is recorded as a separate bank fee.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            The statement carries no counterparty details, so Budgie knows who you paid only from the description. Your own
                            categorization rules also run on the new operations. If you hold PrivatBank cards in different currencies, each
                            becomes a separate account, and{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/multi-currency`}>
                                multi-currency tracking
                            </Link>{' '}
                            brings them together in your main currency.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Adding new operations later</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Once the card is in Budgie, you do not need to repeat the setup. Export a fresh statement from Privat24, then
                            long-press the PrivatBank account card on Budgie&apos;s home screen. The file picker opens straight away: pick
                            the new file and Budgie imports it in the background.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            When it finishes, Budgie shows how many operations were new, how many were already imported and how many it
                            checked. Nothing is doubled, so the new statement can safely overlap the previous one.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            The shortcut only adds operations to cards you have already set up. A statement for a new card goes through Step
                            2 once.
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
                                <strong>The file cannot be selected.</strong> Make sure you saved the Excel version of the statement, not
                                the PDF or CSV one.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>The balance differs from the bank.</strong> The statement most likely starts after the card&apos;s
                                first operation. Import the earlier period as well; operations you already have are skipped.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>The long-press reports no matching accounts.</strong> The file belongs to a card you have not added
                                yet. Add it once through Step 2.
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
                        <BlogFaqItem question={<Trans>Can Budgie import a PDF statement from Privat24?</Trans>}>
                            <Trans>
                                No. For PrivatBank, Budgie accepts only the Excel statement, so choose Excel as the format when you export
                                it.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Will importing the same statement twice create duplicates?</Trans>}>
                            <Trans>
                                No. Budgie recognizes operations it has already imported and skips them, so overlapping periods are safe.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Is my statement sent to a server?</Trans>}>
                            <Trans>
                                No. Budgie reads the file on your phone and keeps the operations there. The statement is never uploaded.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Does Budgie sync with PrivatBank automatically?</Trans>}>
                            <Trans>
                                No. PrivatBank import works from a statement file. To add new operations, export a fresh statement and
                                long-press the account card in Budgie.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Can I import several PrivatBank cards?</Trans>}>
                            <Trans>
                                Yes. Export a statement for each card and import them one after another. Each card becomes its own account
                                in Budgie.
                            </Trans>
                        </BlogFaqItem>
                    </BlogFaqSection>
                </BlogArticleSection>
            </BlogArticleContent>
        </BlogArticlePageShell>
    );
}
