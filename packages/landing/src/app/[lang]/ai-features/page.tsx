/* eslint-disable max-lines, max-lines-per-function -- SEO page keeps unique content inline instead of registry-driven */
import { msg, t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeaturePageCategoryComparison } from '../../../feature/component/feature-page-category-comparison/feature-page-category-comparison';
import { FeaturePageFaqItem } from '../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageSection } from '../../../feature/component/feature-page-section/feature-page-section';
import { FeatureStory } from '../../../feature/component/feature-story/feature-story';
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
                        <Trans>Category and tag translation for Cyrillic, Greek, and Arabic names</Trans>
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
                        href={`/${lang}/features/ai-category-translation`}
                        index={2}
                        tagline={
                            <Trans>
                                Cyrillic, Greek, and Arabic category and tag names become readable and searchable — on your phone.
                            </Trans>
                        }
                        title={<Trans>AI Category & Tag Translation</Trans>}
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
                    <PillarHubFeatureGrid.Item
                        href={`/${lang}/features/bulk-categorize-transactions`}
                        index={6}
                        tagline={
                            <Trans>
                                Uncategorized transactions grouped by merchant, with suggestions from your own history. No AI download
                                needed.
                            </Trans>
                        }
                        title={<Trans>Bulk Transaction Categorization</Trans>}
                    />
                </PillarHubFeatureGrid>
            </PillarHubSection>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>It all happens on your phone</Trans>}>
                    <Trans>
                        One switch in Settings, and categories, tags, translation and voice entry all run where your data already is.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>One switch, one download</Trans>}>
                    <Trans>
                        New installs start with the On-device AI card off; if you were already using AI, it stays on. Either way the switch
                        controls it, and about 2.5 GB downloads once.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie settings screen with the AI section, the On-device AI toggle switched on and two AI status cards below it`}
                    index={0}
                    locale={lang}
                    scene="on-device-ai-budget-app-1"
                    slug="on-device-ai-budget-app"
                >
                    <FeatureStory.Callout y={0.622}>
                        <Trans>One switch for every AI feature</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.748}>
                        <Trans>Translation and learning progress</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Nothing goes out to be processed</Trans>}>
                    <Trans>Budgie writes the English name and the search keywords for a foreign category right on the phone.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie edit category screen showing an AI-generated metadata block with an English translation and search keywords`}
                    index={1}
                    locale={lang}
                    scene="ai-category-translation-1"
                    slug="ai-category-translation"
                >
                    <FeatureStory.Callout y={0.4}>
                        <Trans>Written on your phone</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.505}>
                        <Trans>Keywords you can search by</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Nothing to send, nothing sent</Trans>}>
                    <Trans>Past that one download, no AI feature opens a connection. There is no provider in the loop to trust.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie settings screen with the offline-and-private notice above the automatic MCC category assignment toggle`}
                    index={2}
                    locale={lang}
                    scene="ai-auto-categorization-2"
                    slug="ai-auto-categorization"
                >
                    <FeatureStory.Callout y={0.23}>
                        <Trans>No cloud sync, no tracking</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Feature comparison</Trans>
                </FeaturePageHeading>
                <FeaturePageCategoryComparison categoryLabel={<Trans>Cloud AI budget assistants</Trans>}>
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>On your phone</Trans>}
                        competitorValue={<Trans>Vendor&apos;s cloud / remote AI service</Trans>}
                        label={<Trans>Where AI runs</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Nothing</Trans>}
                        competitorValue={<Trans>Every transaction title, often more</Trans>}
                        label={<Trans>What gets sent</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Yes</Trans>}
                        competitorValue={<Trans>No</Trans>}
                        label={<Trans>Works offline</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>No</Trans>}
                        competitorValue={<Trans>Often yes</Trans>}
                        label={<Trans>AI subscription required</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Total — no provider exists</Trans>}
                        competitorValue={<Trans>Bound by their privacy policy</Trans>}
                        label={<Trans>Privacy from AI provider</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Improves with your corrections</Trans>}
                        competitorValue={<Trans>Static, plus your data trains their model</Trans>}
                        label={<Trans>Suggestion quality</Trans>}
                    />
                </FeaturePageCategoryComparison>
            </FeaturePageSection>

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
                <FeaturePageFaqItem
                    question={<Trans>Which AI features run on my phone?</Trans>}
                    answer={
                        <Trans>
                            Category suggestions, tag suggestions, category and tag translation, and voice entry all run on your phone, on
                            both iOS and Android — nothing leaves the device.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How is this different from a cloud AI assistant?</Trans>}
                    answer={
                        <Trans>
                            A cloud assistant ships your transaction titles to a remote service and trusts the provider&apos;s privacy
                            policy. Budgie does the work on your device — there&apos;s no provider to trust.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does on-device AI drain battery?</Trans>}
                    answer={
                        <Trans>
                            Nothing runs until you trigger it. Budgie gets ready when the feature that needs it starts, stays ready for
                            about half a minute after you finish, and lets go when the app goes to the background — so the first request
                            after a pause waits a moment and the ones after it do not.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </PillarHubPageShell>
    );
}
