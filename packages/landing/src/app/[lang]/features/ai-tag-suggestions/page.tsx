/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { History, Tags, WifiOff } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function AiTagSuggestionsFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie new expense screen with the Groceries category selected and three suggested tag pills above the actions`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Tap your tags, skip typing</Trans>}
                tagline={
                    <Trans>
                        After selecting a category, Budgie proposes the tags you usually use for similar transactions as tappable pill
                        chips. For new entries they come straight from your history; the on-device model adds suggestions when you edit or
                        dictate.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="ai-tag-suggestions-1" slug="ai-tag-suggestions" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Tags suggested as you save</Trans>}>
                    <Trans>Pick a category and Budgie proposes tags you already use, ready to tap.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Point index={0}>
                    <Trans>Choose a category and tag pills appear above the tag button.</Trans>
                </FeatureStory.Point>

                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="ai-tag-suggestions-1" slug="ai-tag-suggestions">
                    <FeatureStory.Callout index={0} y={0.447}>
                        <Trans>Suggested tag pills</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} x={0.66} y={0.507}>
                        <Trans>Tags still open as usual</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Point index={1}>
                    <Trans>On a new entry the pills come from tags you gave similar transactions before.</Trans>
                </FeatureStory.Point>
                <FeatureStory.Point index={2}>
                    <Trans>
                        Tap a pill to add the tag instead of typing it. Editing a transaction or dictating one also uses the on-device
                        model, if you turned it on.
                    </Trans>
                </FeatureStory.Point>
            </FeatureStory>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Tags} title={<Trans>Tag with one tap</Trans>}>
                    <Trans>Tag suggestions as tappable pills after category selection — zero typing required</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={History} title={<Trans>Instant from your history</Trans>}>
                    <Trans>New manual entries get suggestions from your history instantly, with nothing to download</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={WifiOff} title={<Trans>Works offline</Trans>}>
                    <Trans>
                        Fully offline — it runs on your phone with no cloud dependency; the optional model needs a one-time download
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Additive interface — suggestions sit alongside the text field, never replacing it</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why manual tagging breaks down at scale</Trans>}>
                    <p>
                        <Trans>
                            Tags are the most powerful dimension in Budgie analytics — they let you slice spending by project, trip, person,
                            or purpose rather than just merchant or category. But their value only materializes when tagging is consistent.
                            Keyboards are slow, spelling varies, and the right tag name is easy to forget. The result is an analytics view
                            full of labeling gaps that make the data less actionable.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Automatic tag suggestions eliminate the friction without removing control. After you pick a category, Budgie
                            looks at how you have tagged similar transactions before and proposes the most relevant tags as pill-shaped
                            chips. A single tap adds the tag. You can still type new ones — the suggestions are additive, not a replacement
                            for the text field.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>History for new entries, the on-device model for edits and voice</Trans>}>
                    <p>
                        <Trans>
                            When you add a new expense by hand, the pills come from your own tagged history and appear straight away — no
                            setup needed. When you edit a transaction or add one by voice, the on-device model ranks the tags you already
                            use by how well they fit the transaction in front of you, catching phrasing variations a simple text lookup
                            would miss. It is optional: turn on On-device AI in Settings and let it download once.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Everything runs on your device. No network call, no vendor profiling. Nothing about your tags is ever uploaded —
                            every suggestion comes from the tags you already use in Budgie.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={2} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>How are tags chosen?</Trans>}
                    answer={
                        <Trans>
                            Budgie ranks candidates by how closely they match the way you tagged similar transactions before. The best
                            matches become tappable pills.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Do I need to download anything?</Trans>}
                    answer={
                        <Trans>
                            Not for new manual entries — those use your own tagged history. The on-device model, used when you edit a
                            transaction or add one by voice, is optional: turn on On-device AI in Settings and it downloads once.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Can I add new tags from the suggestion strip?</Trans>}
                    answer={<Trans>Yes — typing a new tag still works in parallel; the suggestions are additive, not exclusive.</Trans>}
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Does this work offline?</Trans>}
                    answer={
                        <Trans>
                            Yes. Suggestions are made on your phone; the optional model works offline after its one-time download.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
