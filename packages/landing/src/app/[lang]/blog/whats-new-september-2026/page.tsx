/* eslint-disable max-lines, max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import { BlogArticleContent } from '../../../../blog/component/blog-article-content/blog-article-content';
import { BlogArticleCta } from '../../../../blog/component/blog-article-cta/blog-article-cta';
import { BlogArticleHeading } from '../../../../blog/component/blog-article-heading/blog-article-heading';
import { BlogArticleHero } from '../../../../blog/component/blog-article-hero/blog-article-hero';
import { BlogArticleListItem } from '../../../../blog/component/blog-article-list-item/blog-article-list-item';
import { BlogArticleList } from '../../../../blog/component/blog-article-list/blog-article-list';
import { BlogArticleMeta } from '../../../../blog/component/blog-article-meta/blog-article-meta';
import { BlogArticleProse } from '../../../../blog/component/blog-article-prose/blog-article-prose';
import { BlogArticleSection } from '../../../../blog/component/blog-article-section/blog-article-section';
import { BlogBreadcrumbCurrent } from '../../../../blog/component/blog-breadcrumb-current/blog-breadcrumb-current';
import { BlogBreadcrumbLink } from '../../../../blog/component/blog-breadcrumb-link/blog-breadcrumb-link';
import { BlogBreadcrumbs } from '../../../../blog/component/blog-breadcrumbs/blog-breadcrumbs';
import { BlogFaqItem } from '../../../../blog/component/blog-faq-item/blog-faq-item';
import { BlogFaqSection } from '../../../../blog/component/blog-faq-section/blog-faq-section';
import { BlogPostingJsonLd } from '../../../../blog/component/blog-posting-json-ld/blog-posting-json-ld';
import { RelatedArticles } from '../../../../blog/component/related-articles/related-articles';
import { buildBlogArticleMetadata } from '../../../../blog/util/build-blog-article-metadata.util';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';
import { Badge } from '../../../../ui/badge';

import { ARTICLE_METADATA } from './metadata';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildBlogArticleMetadata({
        author: ARTICLE_METADATA.author,
        date: ARTICLE_METADATA.date,
        description: i18n._(ARTICLE_METADATA.seoDescription),
        keywords: ARTICLE_METADATA.seoKeywords.join(', '),
        locale: lang,
        slug: ARTICLE_METADATA.slug,
        title: i18n._(ARTICLE_METADATA.title)
    });
}

export default async function WhatsNewSeptember2026Article(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    return (
        <main className="flex-1">
            <BlogPostingJsonLd
                author={ARTICLE_METADATA.author}
                blogLabel={t(i18n)`Blog`}
                date={ARTICLE_METADATA.date}
                description={i18n._(ARTICLE_METADATA.description)}
                homeLabel={t(i18n)`Home`}
                image={`/${lang}/blog/${ARTICLE_METADATA.slug}/opengraph-image`}
                keywords={ARTICLE_METADATA.seoKeywords.join(', ')}
                locale={lang}
                slug={ARTICLE_METADATA.slug}
                title={i18n._(ARTICLE_METADATA.title)}
            />

            <BlogArticleHero article={ARTICLE_METADATA} locale={lang}>
                <BlogBreadcrumbs>
                    <BlogBreadcrumbLink href={`/${lang}`} position={1}>
                        <Trans>Home</Trans>
                    </BlogBreadcrumbLink>
                    <BlogBreadcrumbLink href={`/${lang}/blog`} position={2}>
                        <Trans>Blog</Trans>
                    </BlogBreadcrumbLink>
                    <BlogBreadcrumbCurrent position={3}>
                        <Trans>What&rsquo;s New: One Runway Verdict, Lighter On-Device AI, and Repaired Transfers</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>What&rsquo;s New: One Runway Verdict, Lighter On-Device AI, and Repaired Transfers</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>
                        The September 2026 cycle replaced the cash-flow widget with one verdict, brought on-device AI back with a real off
                        switch, and closed out a batch of import and transfer bugs. Here is what changed, with no marketing gloss.
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
                                <Trans>runway</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>on-device ai</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>security</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>bank sync</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>fixes</Trans>
                            </Badge>
                        </>
                    }
                />
            </BlogArticleHero>

            <BlogArticleContent>
                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Runway: one verdict instead of a dashboard</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            The home screen now shows a Runway pill next to your total balance — a short read like &ldquo;+$420/mo&rdquo; or
                            &ldquo;≈4 mo&rdquo; that tells you whether you are growing or burning through savings, without opening a report.
                            Tapping it opens the Runway tab, which leads with a single verdict card: growing or burning, months of cover
                            left or net per month, and a run-out date when you are burning.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            A new Settings → Runway section controls it: &ldquo;Show on home&rdquo; toggles the pill (on by default), and
                            &ldquo;Include crypto&rdquo; folds your crypto holdings into the calculation at today&rsquo;s market value (off
                            by default, since crypto swings can otherwise dominate a cash-flow read).
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>On-device AI got lighter, and easier to turn off</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            On-device AI is back for people who installed Budgie before it first shipped — an update earlier this cycle had
                            left it silently off for those installs. Settings now has a straightforward on-device AI switch, so turning
                            categorization and voice entry off (or back on) no longer means digging through onboarding again.
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            The bigger change is when the underlying models actually load. They used to load in full every time you opened
                            the app, whether or not you used any AI feature that session. Now each model loads only when a feature that
                            needs it runs, and is released again a short while after you stop using it — nothing loads at all if you never
                            touch an AI feature.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Recurring bills, properly detected</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Recurring-payment detection was rebuilt around the actual billing cadence instead of a fixed monthly assumption:
                            it now recognizes bi-monthly and quarterly bills, merges near-duplicate merchant names into one series, and
                            projects upcoming occurrences into both past and future months instead of only the current one.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Unlock and restore, fixed</Trans>
                    </BlogArticleHeading>
                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                Devices with a fingerprint sensor and no face scanner now get prompted for biometric unlock at all — they
                                were silently skipped before — and the lock screen shows a fingerprint icon instead of a face-scan icon on
                                those devices.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Restoring a PIN-protected backup now asks for that backup&rsquo;s PIN and adopts it as your app PIN, instead
                                of leaving the restored data unreadable behind your old PIN.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                A source of crashes around backup restore, PIN changes, and resetting the app is gone: those operations now
                                run strictly one at a time instead of racing each other.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Imports and repairs</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>
                            Transfers between your own PrivatBank cards now get paired and classified correctly instead of sitting around as
                            two unrelated entries; matching now checks the card number first and only falls back to the account number when
                            that is unavailable. See{' '}
                            <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/account-transfers`}>
                                account transfers
                            </Link>
                            .
                        </Trans>
                    </BlogArticleProse>
                    <BlogArticleProse>
                        <Trans>
                            The PrivatBank import instructions were rewritten to match the real Privat24 flow: export the statement as Excel
                            (PDF and CSV are rejected), grab the file from your email if Privat24 sends it there instead of downloading it
                            directly, and know upfront that this is a one-time import, not a live sync. The button is labeled
                            &ldquo;Import&rdquo; to match.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Smaller fixes worth a list</Trans>
                    </BlogArticleHeading>
                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                The split screen&rsquo;s &ldquo;left to assign&rdquo; footer could get stuck at a fraction of a cent and
                                never turn into the confirm button; the remaining amount is now compared exactly. See{' '}
                                <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/split-transactions`}>
                                    split transactions
                                </Link>
                                .
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Transferring money to or from a debt account keeps the category you had on the original entry instead of
                                overwriting it with a generic transfer category. See{' '}
                                <Link className="font-semibold underline underline-offset-4" href={`/${lang}/features/debt-tracking`}>
                                    debt &amp; loan tracking
                                </Link>
                                .
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>An active amount-range filter now carries over into the Missing categories screen.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Default category titles in the refund and consolidation pickers now respect your app language.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Finishing bank-sync setup returns you to onboarding instead of leaving you stranded on the sync screen.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Applying a categorization rule to existing transactions now runs in the background with a completion toast
                                instead of blocking the screen.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Debt cards show a proper loading state instead of briefly flashing the full original amount, and the debt
                                progress track now animates with reduced-motion support.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Frequently Asked Questions</Trans>
                    </BlogArticleHeading>

                    <BlogFaqSection locale={lang}>
                        <BlogFaqItem question={<Trans>Do I need to do anything to get these changes?</Trans>}>
                            <Trans>
                                No. Everything here ships in the regular app update. Runway and on-device AI are visible immediately;
                                Runway&rsquo;s home pill and crypto inclusion can be turned off again in Settings if you prefer the old
                                header.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>I had on-device AI enabled before — did anything change for me?</Trans>}>
                            <Trans>
                                Your setting is unchanged. What changed is timing: models now load only while a feature is actually running
                                instead of every time you open the app.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Is there a full changelog with every release?</Trans>}>
                            <Trans>
                                This post groups the user-visible work from one release window. It is not a line-by-line release log; check
                                the app store listing for the exact version history.
                            </Trans>
                        </BlogFaqItem>
                    </BlogFaqSection>
                </BlogArticleSection>
            </BlogArticleContent>

            <BlogArticleCta locale={lang} />

            <RelatedArticles locale={lang} slugs={ARTICLE_METADATA.relatedArticleSlugs} />

            <FeaturePageRelated locale={lang} slugs={ARTICLE_METADATA.relatedFeatureSlugs} />
        </main>
    );
}
