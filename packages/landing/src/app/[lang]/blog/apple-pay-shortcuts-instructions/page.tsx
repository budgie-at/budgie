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
import { BlogArticleSubheading } from '../../../../blog/component/blog-article-subheading/blog-article-subheading';
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

import { ArticleFigure } from './article-figure/article-figure';
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
        image: ARTICLE_METADATA.image,
        keywords: ARTICLE_METADATA.seoKeywords.join(', '),
        locale: lang,
        slug: ARTICLE_METADATA.slug,
        title: i18n._(ARTICLE_METADATA.title)
    });
}

export default async function ApplePayShortcutsInstructionsArticle(props: PageLangParam) {
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
                image={ARTICLE_METADATA.image}
                keywords={ARTICLE_METADATA.seoKeywords.join(', ')}
                locale={lang}
                slug={ARTICLE_METADATA.slug}
                title={i18n._(ARTICLE_METADATA.title)}
            />

            <BlogArticleHero image={ARTICLE_METADATA.image} imageAlt={i18n._(ARTICLE_METADATA.title)}>
                <Link
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                    href={`/${lang}/blog`}
                >
                    <Trans>← Back to Blog</Trans>
                </Link>

                <BlogBreadcrumbs>
                    <BlogBreadcrumbLink href={`/${lang}`} position={1}>
                        <Trans>Home</Trans>
                    </BlogBreadcrumbLink>
                    <BlogBreadcrumbLink href={`/${lang}/blog`} position={2}>
                        <Trans>Blog</Trans>
                    </BlogBreadcrumbLink>
                    <BlogBreadcrumbCurrent position={3}>
                        <Trans>How to Set Up Apple Pay Capture with Shortcuts</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>How to Set Up Apple Pay Capture with Shortcuts</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>Create one iOS Shortcuts automation so future eligible Apple Pay taps can arrive in Budgie for review.</Trans>
                </p>

                <BlogArticleMeta
                    author={ARTICLE_METADATA.author}
                    date={ARTICLE_METADATA.date}
                    locale={lang}
                    readingTimeMinutes={ARTICLE_METADATA.readingTimeMinutes}
                    tags={
                        <>
                            <Badge variant="secondary">
                                <Trans>Apple Pay</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>Shortcuts</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>iOS automation</Trans>
                            </Badge>
                        </>
                    }
                />
            </BlogArticleHero>

            <BlogArticleContent>
                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Quick checklist</Trans>
                    </BlogArticleHeading>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Use an iPhone with Apple Pay and the Shortcuts app installed.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Open Budgie and turn on Apple Pay capture in Settings.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Create a personal automation that runs after a Wallet transaction.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Add the Budgie action and bind the Wallet transaction fields.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Make one small test payment, then review the capture in Budgie.</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <ArticleFigure
                        alt={t(i18n)`Budgie Apple Pay capture settings screen`}
                        caption={
                            <Trans>Start in Budgie Settings. Apple Pay capture must be enabled before Shortcuts sends payments.</Trans>
                        }
                        src="/images/apple-pay-shortcuts-instructions/apple-pay-capture-settings-screen.png"
                    />
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Set up Budgie first</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Open Budgie, go to Settings, then Apple Pay Capture. Choose the account where Apple Pay card payments should
                            appear. Keep this screen available while you create the automation.
                        </Trans>
                    </BlogArticleProse>

                    <ArticleFigure
                        alt={t(i18n)`Budgie Apple Pay capture setup screen`}
                        caption={<Trans>The setup screen shows which account Budgie will use when a Shortcuts event arrives.</Trans>}
                        src="/images/apple-pay-shortcuts-instructions/apple-pay-capture-setup-screen.png"
                    />
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Create the Shortcuts automation</Trans>
                    </BlogArticleHeading>

                    <ArticleFigure
                        alt={t(
                            i18n
                        )`Create one iOS Shortcuts automation so future eligible Apple Pay taps can arrive in Budgie for review.`}
                        caption={
                            <Trans>
                                Create one iOS Shortcuts automation so future eligible Apple Pay taps can arrive in Budgie for review.
                            </Trans>
                        }
                        src="/images/apple-pay-shortcuts-instructions/apple-pay-shortcuts-automation-flow.webp"
                    />

                    <BlogArticleProse>
                        <Trans>
                            Open Shortcuts, choose Automation, then create a personal automation for Wallet transactions. Select the card
                            you use with Apple Pay and set the automation to run immediately when iOS offers that option.
                        </Trans>
                    </BlogArticleProse>

                    <ArticleFigure
                        alt={t(i18n)`Illustration of selecting the Wallet transaction trigger in Shortcuts`}
                        caption={
                            <Trans>Illustration: choose the Wallet transaction trigger so iOS starts the automation after a payment.</Trans>
                        }
                        src="/images/apple-pay-shortcuts-instructions/shortcuts-trigger-selection.webp"
                    />

                    <BlogArticleSubheading>
                        <Trans>Add the Budgie action</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            In the automation action list, search for Budgie. Add the action that records an Apple Pay capture. Bind the
                            Wallet transaction amount, merchant, and card fields, then choose the Budgie account for the payment.
                        </Trans>
                    </BlogArticleProse>

                    <ArticleFigure
                        alt={t(i18n)`Illustration of binding Wallet transaction fields to the Budgie action`}
                        caption={
                            <Trans>
                                Illustration: pass the Wallet transaction fields into the Budgie action instead of typing fixed values.
                            </Trans>
                        }
                        src="/images/apple-pay-shortcuts-instructions/shortcuts-action-binding.webp"
                    />

                    <BlogArticleSubheading>
                        <Trans>Save the automation</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Review the automation, turn off extra confirmation prompts when iOS allows it, and save. The automation only
                            affects future eligible Apple Pay taps.
                        </Trans>
                    </BlogArticleProse>

                    <ArticleFigure
                        alt={t(i18n)`Illustration of saving the Apple Pay Shortcuts automation`}
                        caption={<Trans>Illustration: save the personal automation after the Budgie action is connected.</Trans>}
                        src="/images/apple-pay-shortcuts-instructions/shortcuts-save-automation.webp"
                    />
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Verify the first payment</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Make a small Apple Pay payment after the automation is saved. Open Budgie and review the captured payment before
                            it becomes a regular transaction. Confirm the merchant, amount, account, and card.
                        </Trans>
                    </BlogArticleProse>

                    <ArticleFigure
                        alt={t(i18n)`Budgie Apple Pay capture review screen`}
                        caption={
                            <Trans>
                                Review the first capture in Budgie so duplicates, merchant, amount, account, and card are correct.
                            </Trans>
                        }
                        src="/images/apple-pay-shortcuts-instructions/apple-pay-capture-review-screen.png"
                    />
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Troubleshooting</Trans>
                    </BlogArticleHeading>

                    <BlogFaqSection locale={lang}>
                        <BlogFaqItem question={<Trans>Nothing appeared in Budgie. What should I check?</Trans>}>
                            <Trans>
                                Confirm Apple Pay capture is enabled in Budgie, the Shortcuts automation is saved, the Budgie action is in
                                the automation, and each Wallet transaction field is bound to the matching Budgie field.
                            </Trans>
                        </BlogFaqItem>
                        <BlogFaqItem question={<Trans>The amount or merchant looks wrong. What should I change?</Trans>}>
                            <Trans>
                                Reopen the Shortcuts action and make sure you used Wallet transaction variables, not typed sample text or
                                fixed numbers.
                            </Trans>
                        </BlogFaqItem>
                        <BlogFaqItem question={<Trans>Why does Budgie ask me to review captures?</Trans>}>
                            <Trans>
                                Review catches duplicates, lets you choose the right action, and keeps imported Apple Pay events under your
                                control before they affect reports.
                            </Trans>
                        </BlogFaqItem>
                    </BlogFaqSection>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Privacy</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Budgie does not read your Wallet history and does not receive a live feed from Apple. The automation runs on
                            your iPhone and sends the selected future payment fields to Budgie. Your Budgie database stays local-first and
                            under your control.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Limitations</Trans>
                    </BlogArticleHeading>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Budgie cannot create the personal automation for you. iOS requires you to save it in Shortcuts.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Budgie cannot import past Wallet history. Only future eligible automation events can be captured.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Apple Pay availability, trigger names, and confirmation options can vary by iOS version and region.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>The Shortcuts visuals in this guide are labeled illustrations, not physical-device screenshots.</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <RelatedArticles locale={lang} slugs={ARTICLE_METADATA.relatedArticleSlugs} />
                <FeaturePageRelated locale={lang} slugs={ARTICLE_METADATA.relatedFeatureSlugs} />
            </BlogArticleContent>

            <BlogArticleCta locale={lang} />
        </main>
    );
}
