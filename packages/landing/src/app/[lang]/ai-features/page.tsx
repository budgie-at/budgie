/* eslint-disable max-lines-per-function -- SEO page keeps unique content inline instead of registry-driven */
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeaturePageFaqItem } from '../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { PillarHubBreadcrumbs } from '../../../feature/component/pillar-hub-breadcrumbs/pillar-hub-breadcrumbs';
import { PillarHubFeatureGrid } from '../../../feature/component/pillar-hub-feature-grid/pillar-hub-feature-grid';
import { PillarHubHeroBulletItem } from '../../../feature/component/pillar-hub-hero-bullet-item/pillar-hub-hero-bullet-item';
import { PillarHubHeroBulletList } from '../../../feature/component/pillar-hub-hero-bullet-list/pillar-hub-hero-bullet-list';
import { PillarHubHero } from '../../../feature/component/pillar-hub-hero/pillar-hub-hero';
import { PillarHubPageShell } from '../../../feature/component/pillar-hub-page-shell/pillar-hub-page-shell';
import { PillarHubSection } from '../../../feature/component/pillar-hub-section/pillar-hub-section';
import { buildPillarHubRouteMetadata } from '../../../feature/util/build-pillar-hub-route-metadata.util';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../i18n/init-lingui';

import { AI_FEATURES_PILLAR_HUB_METADATA } from './metadata';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildPillarHubRouteMetadata(i18n, AI_FEATURES_PILLAR_HUB_METADATA);
}

export default async function AiFeaturesPillarHubPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    return (
        <PillarHubPageShell
            description={i18n._(AI_FEATURES_PILLAR_HUB_METADATA.metaDescription)}
            homeLabel={i18n._(msg`Home`)}
            locale={lang}
            publishedAt={AI_FEATURES_PILLAR_HUB_METADATA.publishedAt}
            slug={AI_FEATURES_PILLAR_HUB_METADATA.slug}
            title={i18n._(AI_FEATURES_PILLAR_HUB_METADATA.metaTitle)}
            updatedAt={AI_FEATURES_PILLAR_HUB_METADATA.updatedAt}
        >
            <PillarHubHero
                breadcrumbs={<PillarHubBreadcrumbs current={i18n._(AI_FEATURES_PILLAR_HUB_METADATA.title)} locale={lang} />}
                heading={<Trans>On-Device AI Finance — Private AI for Your Money</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Qwen3 1.7B and a 768-dim embedding model run entirely on your phone. Smart suggestions, voice entry, and
                        auto-categorization — no data leaves your device.
                    </Trans>
                }
            >
                <PillarHubHeroBulletList>
                    <PillarHubHeroBulletItem>
                        <Trans>Qwen3 1.7B runs on your phone — no API key, no subscription</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>768-dimensional embedding model for instant category suggestions</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>Voice transaction entry via whisper.rn — audio never leaves the device</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>Merchant name normalization for Cyrillic and foreign bank statements</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>Every AI correction improves future suggestions via on-device learning</Trans>
                    </PillarHubHeroBulletItem>
                </PillarHubHeroBulletList>
            </PillarHubHero>

            <PillarHubSection>
                <PillarHubFeatureGrid>
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/ai-auto-categorization`}
                        index={0}
                        tagline={
                            <Trans>
                                Two on-device models — Qwen3 1.7B for chat and a 768-dim embedding model — power category, tag, and merchant
                                suggestions privately.
                            </Trans>
                        }
                        title={<Trans>On-Device AI Auto-Categorization</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/voice-transaction-entry`}
                        index={1}
                        tagline={
                            <Trans>
                                Speak it. Budgie logs it. whisper.rn (whisper.cpp backend) transcribes on-device — audio never leaves your
                                phone.
                            </Trans>
                        }
                        title={<Trans>Voice Transaction Entry</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/ai-merchant-translation`}
                        index={2}
                        tagline={
                            <Trans>
                                Cyrillic, Greek, Arabic merchant strings — the on-device LLM transliterates and adds search keywords.
                            </Trans>
                        }
                        title={<Trans>AI Merchant Name Translation</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/ai-transaction-suggestions`}
                        index={3}
                        tagline={
                            <Trans>
                                Open the expense form and Budgie offers pill-shaped suggestions from your own history — category, tags,
                                comment, amount, account, all pre-filled.
                            </Trans>
                        }
                        title={<Trans>Smart Transaction Suggestions — Tap and Done</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/ai-tag-suggestions`}
                        index={4}
                        tagline={
                            <Trans>
                                After picking a category, the on-device LLM proposes up to three tags as tappable pills. Embedding-first
                                fallback when the LLM is busy.
                            </Trans>
                        }
                        title={<Trans>Automatic Tag Suggestions — Tap, Don&apos;t Type</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/mcc-auto-category`}
                        index={5}
                        tagline={
                            <Trans>Bank-issued codes do the work — coffee shops land in Food &amp; Drink, gas stations in Transport.</Trans>
                        }
                        title={<Trans>MCC Auto-Categorization</Trans>}
                    />
                </PillarHubFeatureGrid>
            </PillarHubSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Budgie uses two on-device models: Qwen3 1.7B for natural-language understanding and chat, and a 768-dimensional
                            embedding model for nearest-neighbor categorization from your own transaction history. Both run locally with no
                            external API call.
                        </Trans>
                    }
                    question={<Trans>Which AI models does Budgie use?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            The embedding model is approximately 90 MB. Qwen3 1.7B in quantized form is approximately 1.1 GB. Both are
                            downloaded once on first use of AI features and cached on-device.
                        </Trans>
                    }
                    question={<Trans>How large are the model downloads?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            No. Voice entry uses whisper.rn — a React Native binding for whisper.cpp — which transcribes audio directly on
                            your device. Your voice recordings are never streamed to any external server.
                        </Trans>
                    }
                    question={<Trans>Does voice entry send audio to a server?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Categorization and suggestions work in any language because they are driven by your own history. Voice entry
                            supports English, Ukrainian, German, French, and Spanish as primary languages, with Whisper large-v3-turbo
                            providing broader coverage for other languages.
                        </Trans>
                    }
                    question={<Trans>What languages does the AI support?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Every time you accept, edit, or reject a category suggestion, the embedding model index updates locally. The
                            more you use Budgie, the more accurately the embedding model mirrors your personal spending patterns.
                        </Trans>
                    }
                    question={<Trans>How does AI improve over time?</Trans>}
                />
            </FeaturePageFaqSection>
        </PillarHubPageShell>
    );
}
