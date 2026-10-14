/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageFaqItem } from '../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function AiTransactionSuggestionsFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie new expense screen with an amount of zero and Transportation and Groceries suggestion pills above the action buttons`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Tap a suggestion, done</Trans>}
                tagline={
                    <Trans>
                        Open the expense form and Budgie offers pill-shaped suggestions from your own history: category first, then tags,
                        then a comment, with the usual amount filled in once you have chosen.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot
                    alt={firstShotAlt}
                    locale={lang}
                    scene="ai-transaction-suggestions-1"
                    slug="ai-transaction-suggestions"
                />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Suggestions before you type</Trans>}>
                    <Trans>The pills on the expense form, and the On-device AI section in Settings that powers them.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Pills appear on the empty form</Trans>}>
                    <Trans>
                        Open a new expense and suggestion pills are already waiting above the action buttons, before an amount is entered.
                        Nothing is filled in until you tap one, and the form works as usual if you ignore them.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={firstShotAlt}
                    index={0}
                    locale={lang}
                    scene="ai-transaction-suggestions-1"
                    slug="ai-transaction-suggestions"
                >
                    <FeatureStory.Callout index={0} y={0.448}>
                        <Trans>Tappable suggestion pills</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.302}>
                        <Trans>Amount still yours to enter</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Powered by the on-device AI</Trans>}>
                    <Trans>
                        Settings has an AI section with an On-device AI switch and a Learning row that shows whether learning is up to date.
                        New manual entries use your own history right away; editing a transaction or adding one by voice also uses the
                        on-device model, once you turn it on and it has downloaded.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie settings AI section with the On-device AI switch, a Translation row and a Learning row reading learning up to date`}
                    index={1}
                    locale={lang}
                    scene="on-device-ai-budget-app-1"
                    slug="on-device-ai-budget-app"
                >
                    <FeatureStory.Callout index={0} y={0.623}>
                        <Trans>On-device AI switch</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.84}>
                        <Trans>Learning up to date</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why the same merchant should never need a second thought</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Typing the category, picking a tag and entering the usual amount for the same coffee shop again and again is wasted
                        effort — the information is already in your history. Budgie surfaces it as tappable pill-shaped chips the moment you
                        open the form, so confirming a familiar expense takes a few taps instead of typing.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Suggestions are made on your device. Your transaction history never leaves your phone, and the suggestions improve
                        as you add more entries.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Your habits first, the on-device model on top</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Budgie spots what repeats weekly or monthly in your history and surfaces the usual category, tags, comment and
                        amount. The pills appear step by step: category first, then tags, then a comment, and the amount is filled in after
                        you have chosen.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        When you edit a transaction or add one by voice, the optional on-device model also matches the title against your
                        whole history by meaning rather than spelling, catching name variations and abbreviations. It works offline after a
                        one-time download. Every transaction you save feeds the next suggestion.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>
                            Tappable suggestions for category, tags and comment, with the usual amount filled in after — all from your own
                            history
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Fully private — suggestions are made on your phone, with no profiling</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Self-improving — accepted or corrected suggestions sharpen the next one</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Works offline on the expense and income forms; the optional model needs a one-time download</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Where do the suggestions come from?</Trans>}
                    answer={
                        <Trans>
                            Your own data: the weekly and monthly patterns Budgie spots in your transactions and, for edits and voice
                            entries, the closest matches to the title in your own history. No cloud calls.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Will it suggest things I never bought?</Trans>}
                    answer={
                        <Trans>No. The suggestion engine only proposes values from transactions you have already logged or imported.</Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I disable suggestions?</Trans>}
                    answer={
                        <Trans>
                            Suggestions are proposals — nothing is applied until you tap one, and every form works exactly the same if you
                            ignore them. The on-device model behind edit and voice suggestions is off until you turn On-device AI on in
                            Settings, and you can switch it off again at any time.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does this work for income and transfers too?</Trans>}
                    answer={<Trans>On expense and income, yes. The transfer form does not show suggestions.</Trans>}
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
