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
import { createFeatureGenerateMetadata } from '../../../../feature/util/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function AiTransactionSuggestionsFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={featureName}
                locale={lang}
                tagline={
                    <Trans>
                        Open the expense form and Budgie offers pill-shaped suggestions from your own history — category, tags, comment, and
                        amount all filled in before you type a single character.
                    </Trans>
                }
            />

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
                    alt={t(
                        i18n
                    )`Budgie new expense screen with an amount of zero and Transportation and Groceries suggestion pills above the action buttons`}
                    index={0}
                    locale={lang}
                    priority
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
                        Suggestions come from your own history on this device.
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
                        The average user logs the same merchant more than thirty times a year. Typing the category, picking a tag, entering
                        the usual amount, and choosing the right account for the same coffee shop is wasted effort — the information is
                        already in your history. Budgie surfaces it as tappable pill-shaped chips the moment you open the form, so
                        confirming a familiar expense takes one tap instead of seven.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Unlike cloud-based suggestion engines that profile spending patterns on a vendor server, every match happens
                        on-device. Your transaction history never leaves your phone, and the suggestions improve as you add more entries —
                        no account, no sync, no exposure.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Two ways of knowing, zero cloud round-trips</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Budgie learns your recurring spending and your one-offs separately. It spots what repeats weekly or monthly and
                        surfaces the usual category and amount for that merchant. Alongside that it matches the title you are typing against
                        your whole history by meaning rather than spelling — catching name variations and abbreviations that a keyword match
                        would miss.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        When both agree, the suggestion chips appear immediately. When they diverge, the recurring pattern wins for amount
                        and category while the history match adds tag and comment hints. Every accepted or corrected suggestion is taken
                        into account, so the next similar entry lands even closer.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Three kinds of match, not one</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Budgie matches your history in three separate ways, each returning up to three candidates. Transaction titles are
                        matched against your past entries to suggest a category and tags. Shop names are matched across spelling variants,
                        so the same store resolves consistently even when two banks write it differently — the visible result behind
                        merchant name clean-up. And your own free-text notes are matched too, so a comment you typed once for a coffee shop
                        comes back as a suggestion the next time you visit it.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>One-tap form fill — category, tags, comment, and amount pre-filled from your own history</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Fully private — everything runs on your phone, no network call, no profiling</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Self-improving — accepted or corrected suggestions sharpen the next one</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Works offline and on every form variant — expense, income, and transfer</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>
                            Three kinds of match — transaction title, merchant name, and your own comments — each surfacing up to three
                            candidates
                        </Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Where do the suggestions come from?</Trans>}
                    answer={
                        <Trans>
                            Two sources, both your own data: the weekly and monthly patterns Budgie spots in your transactions, and the
                            closest matches to the title you are typing in your own history. No cloud calls.
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
                            ignore them. Settings → AI shows what the on-device AI is doing and how far along it is.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does this work for income and transfers too?</Trans>}
                    answer={<Trans>Yes. The suggestion engine runs on every form variant — expense, income, and transfer.</Trans>}
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
