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
                        Budgie&apos;s AI runs entirely on your phone. Smart suggestions, voice entry, and auto-categorization — no data
                        leaves your device.
                    </Trans>
                }
            >
                <PillarHubHeroBulletList>
                    <PillarHubHeroBulletItem>
                        <Trans>Runs on your phone, not in the cloud — no API key, no subscription</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>Category suggestions drawn from your own history — never from a cloud service</Trans>
                    </PillarHubHeroBulletItem>
                    <PillarHubHeroBulletItem>
                        <Trans>Voice transaction entry — the audio never leaves the device</Trans>
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
                                Category, tag, and merchant suggestions that run entirely on your phone and learn from your corrections.
                            </Trans>
                        }
                        title={<Trans>On-Device AI Auto-Categorization</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/voice-transaction-entry`}
                        index={1}
                        tagline={<Trans>Speak it. Budgie logs it. Speech is transcribed on your phone — the audio never leaves it.</Trans>}
                        title={<Trans>Voice Transaction Entry</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/ai-merchant-translation`}
                        index={2}
                        tagline={<Trans>Cyrillic, Greek, and Arabic merchant names become readable and searchable — on your phone.</Trans>}
                        title={<Trans>AI Merchant Name Translation</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/ai-transaction-suggestions`}
                        index={3}
                        tagline={
                            <Trans>
                                Open the expense form and Budgie offers pill-shaped suggestions from your own history — category, tags,
                                comment, and amount, all filled in.
                            </Trans>
                        }
                        title={<Trans>Smart Transaction Suggestions — Tap and Done</Trans>}
                    />
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/ai-tag-suggestions`}
                        index={4}
                        tagline={
                            <Trans>
                                After picking a category, Budgie proposes up to three tags as tappable pills — instantly, even while the
                                larger model is still warming up.
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
                            Three jobs, all done on your device: understanding what you write or say, matching a new transaction against the
                            ones you have already categorized, and turning speech into text. Every one of them runs on your phone with no
                            external call.
                        </Trans>
                    }
                    question={<Trans>Where does Budgie&apos;s AI run?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            About 1.6 GB for categorization and suggestions, plus a further 0.9 GB if you use voice entry. Nothing downloads
                            until you switch On-device AI on in Settings, and then only when you first use the feature that needs it. Each
                            download happens once and is kept on the device afterwards.
                        </Trans>
                    }
                    question={<Trans>How large is the one-time download?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            No. Voice entry transcribes the audio directly on your device. Your voice is never streamed to an external
                            server and no recording is kept.
                        </Trans>
                    }
                    question={<Trans>Does voice entry send audio to a server?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Categorization and suggestions work in any language because they are driven by your own history. Voice entry
                            supports English, Ukrainian, German, French, and Spanish as primary languages, with broader coverage for dozens
                            more.
                        </Trans>
                    }
                    question={<Trans>What languages does the AI support?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Every time you accept, edit, or reject a category suggestion, Budgie updates its local index of your history.
                            The more you use Budgie, the more closely its suggestions mirror your own spending patterns.
                        </Trans>
                    }
                    question={<Trans>How does AI improve over time?</Trans>}
                />
                <FeaturePageFaqItem
                    answer={
                        <Trans>
                            Yes. Settings has an AI section with a single On-device AI switch that turns the whole subsystem on or off.
                            Switch it off and nothing downloads, nothing loads, and no suggestion runs — the rest of Budgie is unaffected.
                            New installs start with it off; if you were already using AI before the switch existed, it stays on.
                        </Trans>
                    }
                    question={<Trans>Can I turn AI off?</Trans>}
                />
            </FeaturePageFaqSection>
        </PillarHubPageShell>
    );
}
