/* eslint-disable max-lines, max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

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
        keywords: t(i18n)`on-device AI budget app, private AI finance, offline AI finance app, offline AI expense tracker`,
        locale: lang,
        slug: ARTICLE_METADATA.slug,
        title: i18n._(ARTICLE_METADATA.title)
    });
}

export default async function OnDeviceAiBudgetAppExplainerPage(props: PageLangParam) {
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
                keywords={t(i18n)`on-device AI budget app, private AI finance, offline AI finance app, offline AI expense tracker`}
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
                        <Trans>On-Device AI in Your Budget App: How It Works and Why It Matters</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>On-Device AI in Your Budget App: How It Works and Why It Matters</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>
                        Cloud AI assistants process your spending data on remote servers. Budgie&apos;s AI works on your phone instead. Here
                        is what that means for your privacy, what it costs you in storage and battery, and what it can and cannot do.
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
                                <Trans>on-device AI</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>privacy</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>offline</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>voice input</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>AI categorization</Trans>
                            </Badge>
                        </>
                    }
                />
            </BlogArticleHero>

            <BlogArticleContent>
                <BlogArticleSection>
                    <BlogArticleProse>
                        <Trans>
                            AI features have become standard in personal finance apps. Auto-categorization, spending insights, budget
                            suggestions — the question is no longer whether your app uses AI, but where that AI runs. For most apps, the
                            answer is: on a remote server, with your transaction data sent over the network to get there.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Budgie takes a different approach. Every AI feature — category suggestions, tag suggestions, merchant name
                            clean-up, and voice transaction entry — runs entirely on your device. Your spending data never leaves your phone
                            to be processed.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            This article explains what that actually means: what happens on the phone, what never leaves it, what it costs
                            in storage and battery, what the AI can and cannot do, and how your corrections make it better.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>What Is On-Device AI?</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            On-device AI means the work happens on the phone in your hand rather than on somebody else&apos;s computer. When
                            Budgie suggests a category, your transaction is read and answered on the device, without a single network call.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Cloud AI vs On-Device AI: The Key Difference</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Cloud AI assistants</strong> — Your transaction description, merchant name, and amount are sent to a
                                remote service. The work happens on the provider&apos;s machines, an answer comes back, and your data is
                                typically logged there for quality and safety monitoring.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>On-device AI</strong> — Everything the app needs is downloaded once, then stays on your phone. Every
                                request is answered locally. No network call, no server log, no third party ever sees the input.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            The tradeoff is capability. A cloud service can throw a warehouse of computers at a question; a phone has a
                            battery and a few gigabytes of memory. For open-ended writing or research, the cloud still wins. For the narrow
                            job of reading a merchant name and picking the right category, a phone is now more than enough — which is
                            exactly why Budgie does it there.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Why Financial Data Is the Worst Thing to Send to the Cloud</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Your transaction stream is one of the most revealing datasets about you. It discloses where you live, where you
                            work, what medical conditions you may have, which political causes you support, and what your relationships look
                            like. Sending it to a remote AI service for processing has concrete risks:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Inference logging</strong> — Most cloud AI providers log inputs for model improvement, safety
                                review, and abuse detection. Your transaction descriptions become training data.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Retention policies</strong> — Even with privacy guarantees, data is retained for some period.
                                Policies change. Acquisitions happen. What is private today may not be private tomorrow.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Aggregated profiling</strong> — When millions of users send similar financial data to the same
                                service, the aggregate reveals behavioral patterns that can be monetized in ways that individual consent
                                forms do not clearly cover.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Breach surface</strong> — Every server that holds user data is a potential breach target. On-device
                                processing eliminates this surface entirely for the AI component.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>What It Costs You: Download, Storage, and Battery</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            AI on your phone is not free — it trades network round-trips for space on the device. Budgie is explicit about
                            the bill, and none of it is charged until you ask for it.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>A one-time download, only if you want it</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Nothing downloads until you switch On-device AI on in Settings. Categorization and suggestions come to about 1.6
                            GB; voice entry adds a further 0.9 GB, for roughly 2.5 GB if you use everything. That happens once. Afterwards
                            it stays on the device and normal use needs no further download.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Battery: only when you ask</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Nothing runs in the background. Budgie gets ready when you open a form or tap the mic, stays ready for about
                            half a minute after you finish, and lets go when the app goes to the background. That is why the first
                            suggestion after a pause waits a moment and the ones after it feel instant — and why the cumulative cost of
                            normal daily use is negligible.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>You can turn it all off</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            One switch in Settings controls the whole thing. Turn it off and nothing downloads, nothing loads, and no
                            suggestion runs — categorization falls back to your own rules and the merchant codes your bank already sends.
                            New installs start with the switch off.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>How a Suggestion Actually Gets Made</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Every suggestion Budgie makes comes from your own data. Nothing is invented, and there is no shared model of
                            other people&apos;s spending involved.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Merchants you have seen before</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Most of what you spend money on, you have spent money on before. Budgie compares a new transaction against the
                            ones you have already categorized and matches them by meaning rather than spelling, so a shop still resolves
                            when two banks write its name differently. This is the path that answers most of the time.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Spending that repeats</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Rent, the commute, the weekly shop — Budgie tracks what repeats weekly and monthly and offers the usual category
                            and amount for it, so confirming a familiar expense is one tap. The code your bank sends with each card payment
                            adds a further hint for merchants your history has nothing to say about.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Your corrections are the training</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Nothing is applied until you accept it, and every accept or edit counts immediately. There is no re-training
                            step and no model update to wait for: the next similar transaction simply lands closer. The longer you use
                            Budgie, the more its suggestions look like your own habits.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Voice Entry: Speak It, Budgie Logs It</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Tap the mic and say what you spent. Your speech becomes text on the phone, and the audio is never sent anywhere.
                            One sentence can produce several transactions — &ldquo;twelve for coffee, forty for the taxi, and eight euros
                            for parking&rdquo; comes back as three separate rows, each with its own amount and category.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Why This Matters for Privacy</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Cloud speech recognition receives raw audio. That audio can contain far more than the expense you meant to
                            record — background conversations, ambient sound, other people. Providers routinely keep samples to improve
                            their systems.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Budgie never sends the audio anywhere. The recording becomes text on the device and is then discarded. No audio
                            file, no upload, no third party involved.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>How the Voice Flow Works</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                You tap the mic in the quick-entry sheet and speak naturally — amounts, what they were for, and optional
                                notes.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Your speech is transcribed on the phone.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Budgie splits the sentence into one row per expense and fills in the amount, a category, and the account
                                matching the currency you said.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                A review sheet shows every row before anything is saved. Fix a row, fix the whole batch at once, or
                                re-record and try again.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            The whole flow works in airplane mode and with no signal. English, Ukrainian, German, French, and Spanish are
                            the primary languages, with dozens more covered.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>What It Can and Cannot Do</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Being honest about the limits is part of the point. Budgie&apos;s AI is built for a narrow job and does not
                            pretend to be an assistant.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>It can</strong> suggest a category, propose up to three tags, reuse a comment you wrote before,
                                offer the usual amount for a familiar merchant, rewrite a non-Latin category name into something readable
                                and searchable, and turn one spoken sentence into several transactions.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>It cannot</strong> invent data it has never seen — every suggested value comes from transactions you
                                already logged or imported. It does not read receipts, it is not a chat assistant, it gives no financial
                                advice, and it never saves anything on your behalf: nothing is written until you tap.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>It is slower on the very first request</strong> after a pause, because it has to get ready first. On
                                older phones that pause is longer, which is why suggestions also have a faster path that answers from your
                                history while the rest warms up.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>It needs some history first.</strong> On a brand-new install there is nothing to match against, so
                                suggestions get noticeably better over the first few weeks.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>It gets things wrong sometimes</strong>, and the interface assumes that. Everything is a proposal
                                you can accept, edit, or ignore — and correcting it is how it improves.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Privacy Guarantees You Can Verify in Source</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Budgie is open source. The privacy claims in this article are not policy statements — they are facts you can
                            check in the code yourself. You can verify:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>No outbound network calls when a suggestion is made</strong> — Suggestions are produced from files
                                and data already on the device. There are no calls to an external AI service, and no API key anywhere.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>No audio data leaves the device</strong> — Voice entry transcribes from an on-device file. The audio
                                is processed in memory and discarded once it has become text.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>The learned index lives with your data</strong> — What Budgie learns from your history is stored on
                                the device alongside your transactions, encrypted the moment you set a PIN, and synced nowhere.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>No telemetry on AI usage</strong> — Budgie does not collect analytics on which AI features you use,
                                how often you accept suggestions, or which categories your transactions fall into.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            If you want to audit these claims yourself, the source is publicly available. You do not have to take our word
                            for it.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Frequently Asked Questions</Trans>
                    </BlogArticleHeading>

                    <BlogFaqSection locale={lang}>
                        <BlogFaqItem question={<Trans>Does running on my phone make the suggestions worse?</Trans>}>
                            <Trans>
                                Not for this job. Sorting your own expenses is a narrow task: the vocabulary is small, and your own history
                                is a far stronger signal than anything a general model could add. A cloud service would be guessing from
                                other people&apos;s data; Budgie is matching against yours.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>How much storage do the AI models use?</Trans>}>
                            <Trans>
                                Categorization and suggestions take about 1.6 GB of storage. Adding voice entry brings the total to about
                                2.5 GB. All of it is optional: nothing downloads until you switch On-device AI on in Settings, and then each
                                part arrives the first time you use the feature that needs it. It downloads once — normal use afterwards
                                needs no further download.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Does the AI drain my battery?</Trans>}>
                            <Trans>
                                Budgie only does this work when you add or edit a transaction — never continuously in the background. It
                                gets ready when the feature that needs it starts and lets go about half a minute after you finish, so the
                                first request after a pause pays for that and the ones after it are quick. The cumulative battery impact of
                                normal daily use is negligible.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Can I use voice entry in languages other than English?</Trans>}>
                            <Trans>
                                Yes. English, Ukrainian, German, French, and Spanish are the primary languages, with dozens more covered.
                                Budgie follows your phone&apos;s language, so there is nothing to configure.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>What happens to AI suggestions if I am offline?</Trans>}>
                            <Trans>
                                Nothing changes. Once the one-time download is done, every AI feature works identically with or without a
                                connection — in airplane mode, on a plane, or with no signal at all. That is the whole point of doing it on
                                the phone.
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
