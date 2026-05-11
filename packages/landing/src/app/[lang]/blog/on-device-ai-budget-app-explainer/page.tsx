/* eslint-disable max-lines, max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import { isDefined } from '@rnw-community/shared';

import { BlogArticleContent } from '../../../../blog/component/blog-article-content/blog-article-content';
import { BlogArticleCta } from '../../../../blog/component/blog-article-cta/blog-article-cta';
import { BlogArticleHeading } from '../../../../blog/component/blog-article-heading/blog-article-heading';
import { BlogArticleHero } from '../../../../blog/component/blog-article-hero/blog-article-hero';
import { BlogArticleList } from '../../../../blog/component/blog-article-list/blog-article-list';
import { BlogArticleListItem } from '../../../../blog/component/blog-article-list-item/blog-article-list-item';
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
import { ARTICLE_REGISTRY } from '../../../../blog/constant/article-registry.constant';
import { buildBlogArticleMetadata } from '../../../../blog/util/build-blog-article-metadata.util';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FEATURE_REGISTRY } from '../../../../feature/constant/feature-registry.constant';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';
import { Badge } from '../../../../ui/badge';

import type { Metadata } from 'next';

const SLUG = 'on-device-ai-budget-app-explainer';
const DATE = '2026-05-07';
// eslint-disable-next-line lingui/no-unlocalized-strings
const AUTHOR = 'Budgie Team';
const IMAGE = '/images/design-mode/ai-budgeting-app-4x.jpg';
const READING_TIME = 11;

const RELATED_SLUGS = ['offline-first-privacy-financial-app', 'budgie-offline-financial-data'] as const;

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildBlogArticleMetadata({
        author: AUTHOR,
        date: DATE,
        description: t(
            i18n
        )`Cloud AI assistants process your spending data on remote servers. On-device AI keeps every inference local. Here is how a 1.7B-param model, offline embeddings, and Whisper speech recognition work together in Budgie.`,
        image: IMAGE,
        keywords: t(i18n)`on-device AI budget app, private AI finance, local LLM finance app, offline AI expense tracker`,
        locale: lang,
        slug: SLUG,
        title: t(i18n)`On-Device AI in Your Budget App: How It Works and Why It Matters`
    });
}

export default async function OnDeviceAiBudgetAppExplainerPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const articleEntry = ARTICLE_REGISTRY.find(item => item.slug === SLUG);
    const relatedFeatures =
        articleEntry?.relatedFeatureSlugs.map(slug => FEATURE_REGISTRY.find(feature => feature.slug === slug)).filter(isDefined) ?? [];

    return (
        <main className="flex-1">
            <BlogPostingJsonLd
                author={AUTHOR}
                blogLabel={t(i18n)`Blog`}
                date={DATE}
                description={t(
                    i18n
                )`Cloud AI assistants process your spending data on remote servers. On-device AI keeps every inference local. Here is how a 1.7B-param model, offline embeddings, and Whisper speech recognition work together in Budgie.`}
                homeLabel={t(i18n)`Home`}
                image={IMAGE}
                keywords={t(i18n)`on-device AI budget app, private AI finance, local LLM finance app, offline AI expense tracker`}
                locale={lang}
                slug={SLUG}
                title={t(i18n)`On-Device AI in Your Budget App: How It Works and Why It Matters`}
            />

            <BlogArticleHero image={IMAGE} imageAlt={t(i18n)`On-device AI powering a private budget app`}>
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
                        <Trans>On-Device AI in Your Budget App: How It Works and Why It Matters</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>On-Device AI in Your Budget App: How It Works and Why It Matters</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>
                        Cloud AI assistants process your spending data on remote servers. On-device AI keeps every inference local. Here is
                        how a 1.7B-param model, offline embeddings, and Whisper speech recognition work together in Budgie.
                    </Trans>
                </p>

                <BlogArticleMeta
                    author={AUTHOR}
                    date={DATE}
                    locale={lang}
                    readingTimeMinutes={READING_TIME}
                    tags={
                        <>
                            <Badge variant="secondary">
                                <Trans>on-device AI</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>privacy</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>local LLM</Trans>
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
                            Budgie takes a different approach. Every AI feature — category suggestions, embedding-based pattern matching,
                            and voice transaction entry — runs entirely on your device. Your spending data never leaves your phone for AI
                            processing.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            This article explains what on-device AI means technically, why it matters for financial privacy, and how Budgie
                            implements it end to end.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>What Is On-Device AI?</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            On-device AI means that the model weights and the inference computation both live on your device — in RAM, using
                            your CPU or neural-engine hardware — rather than on a cloud server. When you ask for a category suggestion, the
                            model receives your input and produces output without any network call.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Cloud AI vs On-Device AI: The Key Difference</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Cloud AI assistants</strong> — Your transaction description, merchant name, and amount are
                                serialized and sent to a remote API. The model runs on the provider&apos;s infrastructure, returns a
                                response, and your data is logged for quality and safety monitoring.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>On-device AI</strong> — The model is bundled with the app (or downloaded once at setup). Every
                                inference call stays on your device. No network request, no server log, no third party ever sees the input.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            The tradeoff is model size. Cloud providers can run billion-parameter models on server clusters with no
                            constraint on memory or compute. On-device models must fit in the memory budget of a phone, which limits their
                            size. Modern quantization techniques have dramatically closed this gap.
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
                        <Trans>How a 1.7B-Parameter LLM Fits on a Phone</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            The core of Budgie AI categorization is a 1.7-billion-parameter language model. A few years ago, running a model
                            this size on a phone would have been impractical. Three advances made it possible:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Quantization</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Full-precision model weights are stored as 32-bit floats, meaning each parameter takes 4 bytes. Quantization
                            reduces this to 4-bit or 8-bit integers, shrinking the model by 4x to 8x with modest accuracy loss. A 1.7B
                            parameter model quantized to 4-bit occupies roughly 900 MB — manageable on modern smartphones.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Neural Engine Acceleration</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Apple Silicon and modern Android processors include dedicated neural processing hardware. These chips run matrix
                            multiplications — the dominant computation in transformer inference — far more efficiently than a general CPU.
                            Inference that would take seconds on a CPU takes milliseconds on a neural engine.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Efficient Inference Runtimes</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Runtimes designed for mobile inference handle memory management, tokenization, and batching in ways optimized
                            for constrained environments. They minimize peak memory usage and keep the thermal footprint low enough for
                            casual use without draining the battery.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            The result is that Budgie can run a capable language model in the background, suggest a category within a
                            fraction of a second, and do so entirely offline — with no network latency and no server costs.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Embeddings and LLM Working Together: The Two-Stage Suggestion Stack</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Budgie uses two complementary AI techniques for transaction categorization. They address different parts of the
                            problem and together produce more accurate suggestions than either approach alone.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Stage 1: Embedding-Based Pattern Matching</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            When you first enter a transaction, Budgie converts the merchant name and description into a dense vector
                            embedding — a numerical representation that captures semantic meaning. This embedding is compared against
                            embeddings of your historical transactions using vector similarity.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            If you have previously categorized transactions from the same merchant, the embedding match returns those
                            categories with high confidence. The embedding model is small and fast — it produces suggestions in milliseconds
                            and is particularly good at recognizing merchants you have encountered before.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Stage 2: LLM-Based Semantic Categorization</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            When the embedding stage produces low-confidence results — for example, with a new merchant or an ambiguous
                            description — the full language model takes over. The LLM receives the transaction description and your category
                            list as context, and generates a ranked suggestion.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            The LLM is slower than the embedding lookup but handles novel inputs well. It understands that a charge from a
                            pharmacy should go under healthcare, even if it has never seen that specific merchant before, because it has
                            learned the semantic relationship between merchant types and spending categories.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Both stages run entirely on your device. The embeddings are stored locally alongside your transaction database.
                            The LLM weights are bundled with the app. Nothing is sent to a remote endpoint at any point in this pipeline.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Whisper.rn for Voice: Offline Speech-to-Text</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Budgie supports voice transaction entry powered by Whisper.rn — a React Native port of OpenAI Whisper, the
                            open-source speech recognition model. Whisper runs entirely on-device. When you speak a transaction, the audio
                            is processed locally and transcribed without being sent to any speech recognition API.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Why This Matters for Privacy</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Cloud speech recognition services receive raw audio. That audio can contain more than just the transaction you
                            intend to record — background conversations, ambient sounds, personally identifying information. Cloud providers
                            routinely use audio samples to improve their models.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Whisper running on your device never sends audio anywhere. The model receives your audio buffer, produces a
                            transcript, and that is the end of the data flow. No audio log, no remote API call, no third party involved.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>How the Voice Flow Works</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                You tap the voice input button and speak the transaction details — amount, merchant, and optional notes.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Whisper transcribes the audio locally, producing a text string.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>The transcribed text is passed to the two-stage categorization stack described above.</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                Budgie presents a pre-filled transaction form with the extracted amount and suggested category for your
                                review before saving.
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            The entire flow — from audio to saved transaction — happens offline. It works in airplane mode, in areas with no
                            signal, and in any language Whisper supports.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Privacy Guarantees You Can Verify in Source</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Budgie is open source. The privacy claims made in this article are not policy statements — they are
                            architectural facts visible in the codebase. You can verify:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>No outbound network calls during AI inference</strong> — The categorization service uses only local
                                model files and the local SQLite database. There are no HTTP calls to external AI endpoints.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>No audio data leaves the device</strong> — The voice entry module uses Whisper.rn with a local model
                                file. Audio buffers are processed in memory and discarded after transcription.
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Embeddings stored in local SQLite</strong> — The embedding vectors for your transaction history are
                                stored in the same encrypted database as your transactions. They are not synced to any server.
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

                    <BlogFaqSection>
                        <BlogFaqItem question={<Trans>Does on-device AI mean the categorization is less accurate?</Trans>}>
                            <Trans>
                                Not meaningfully for personal expense categorization. The task is well-suited to smaller models: the
                                vocabulary is limited, the context window is short, and your personal transaction history provides strong
                                prior signal via embeddings. Budgie two-stage stack produces accuracy comparable to cloud approaches for
                                this specific task.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>How much storage do the AI models use?</Trans>}>
                            <Trans>
                                The language model and the embedding model together require approximately 900 MB to 1.2 GB of storage
                                depending on the quantization level selected during installation. This is a one-time download. Once
                                installed, no additional model downloads are required for normal use.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Does the AI drain my battery?</Trans>}>
                            <Trans>
                                Budgie runs AI inference only when you add or edit a transaction — not continuously in the background. Each
                                categorization inference completes in under a second on modern hardware. The cumulative battery impact of
                                normal daily use is negligible.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Can I use voice entry in languages other than English?</Trans>}>
                            <Trans>
                                Yes. Whisper supports over 90 languages. Budgie voice entry works in any language Whisper supports,
                                including multilingual conversations. Language detection is automatic.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>What happens to AI suggestions if I am offline?</Trans>}>
                            <Trans>
                                Nothing changes. On-device AI is inherently offline. All AI features work identically whether you have
                                network connectivity or not. This is one of the core advantages of the architecture.
                            </Trans>
                        </BlogFaqItem>
                    </BlogFaqSection>
                </BlogArticleSection>
            </BlogArticleContent>

            <BlogArticleCta locale={lang} />

            <RelatedArticles locale={lang} slugs={RELATED_SLUGS} />

            <FeaturePageRelated features={relatedFeatures} locale={lang} />
        </main>
    );
}
