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

export default async function AiAutoCategorizationFeaturePage(props: PageLangParam) {
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
                        Category, tag, and merchant suggestions that run entirely on your phone and learn from your corrections. Your
                        statements never leave the device.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Categories proposed on your phone</Trans>}>
                    <Trans>Pill suggestions on the expense form, the privacy notice in Settings, and the On-device AI section.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Category pills on the expense form</Trans>}>
                    <Trans>
                        Open a new expense and Budgie offers categories as pills above the action buttons, drawn from transactions you have
                        already categorized. Tapping a pill picks the category, and the Category button still opens the full list.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie new expense screen with Transportation and Groceries category pills above the Split, Date, Note, Tags and Category buttons`}
                    index={0}
                    locale={lang}
                    priority
                    scene="ai-auto-categorization-1"
                    slug="ai-auto-categorization"
                >
                    <FeatureStory.Callout index={0} y={0.448}>
                        <Trans>Suggested category pills</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} x={0.8} y={0.494}>
                        <Trans>The full category list is one tap away</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Offline, private, and card-code aware</Trans>}>
                    <Trans>
                        Settings opens with a Privacy card stating that your financial data is stored locally on your device. Further down,
                        a toggle assigns default categories from the merchant category codes your bank sends with card payments.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie settings screen with the offline-and-private notice above the automatic MCC category assignment toggle`}
                    index={1}
                    locale={lang}
                    scene="ai-auto-categorization-2"
                    slug="ai-auto-categorization"
                >
                    <FeatureStory.Callout index={0} y={0.259}>
                        <Trans>100% Offline &amp; Private</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>One switch for the on-device AI</Trans>}>
                    <Trans>
                        The AI section of Settings holds the On-device AI switch, which says it categorizes transactions on this device and
                        downloads about 2.5 GB of models once. Below it, a Learning row shows whether learning is up to date.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie settings AI section with the On-device AI switch, a Translation row and a Learning row reading learning up to date`}
                    index={2}
                    locale={lang}
                    scene="on-device-ai-budget-app-1"
                    slug="on-device-ai-budget-app"
                >
                    <FeatureStory.Callout index={0} y={0.623}>
                        <Trans>On-device AI</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.84}>
                        <Trans>Learning up to date</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why on-device AI is the only AI that protects your statements</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Cloud &ldquo;AI&rdquo; budgeting apps send every merchant name to a remote server, which means somebody else&apos;s
                        computer sees your supermarket habits. Budgie works it out on your own device — same accuracy, nothing to leak.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Budgie recognizes merchants you have categorized before, spots the spending that repeats month after month, and
                        reads the merchant code your bank sends with each card payment. Every accepted or edited suggestion is taken into
                        account immediately — accuracy compounds over time.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How a suggestion is made</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0} key="stage-0">
                        <Trans>
                            Seen before — Budgie finds the closest match among transactions you have already categorized, which is the fast
                            path
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1} key="stage-1">
                        <Trans>
                            Spending that repeats — rent, the commute, the weekly shop all come back with their usual category and amount
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2} key="stage-2">
                        <Trans>
                            Correction loop — every accepted or edited suggestion counts immediately, so the next similar transaction lands
                            closer without any re-training
                        </Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Everything runs on your phone after a one-time download</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Merchants you have categorized before are recognized instantly</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Card payments from an unfamiliar shop still land in the right area, using the code your bank sends</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Every correction counts on the spot — accuracy improves as you use it</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Statements never leave the device — no cloud AI, no remote processing, ever</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Does the AI work offline?</Trans>}
                    answer={
                        <Trans>
                            Yes. Everything it needs lives on your device after the one-time download. Categorization runs whether
                            you&apos;re online or not.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How big is the download?</Trans>}
                    answer={
                        <Trans>
                            About 1.6 GB for categorization and suggestions, plus a further 0.9 GB if you turn on voice entry. Each part
                            arrives the first time you use the feature that needs it, and all of it is optional — you can keep using Budgie
                            without AI.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I correct the AI&apos;s suggestions?</Trans>}
                    answer={
                        <Trans>
                            Always. Every transaction lets you accept, edit, or reject the suggestion. Your corrections count immediately,
                            so the next similar transaction lands closer to the right category.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I turn AI off?</Trans>}
                    answer={
                        <Trans>
                            Yes. Settings has an AI section with a single On-device AI switch. Turn it off and nothing downloads, nothing
                            loads, and no suggestion runs — categorization falls back to your rules and the bank&apos;s own merchant codes.
                            New installs start with the switch off; if you were already using AI before the switch existed, it stays on.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does Budgie send my transactions to a cloud AI?</Trans>}
                    answer={
                        <Trans>
                            No. Everything is worked out on your own device. There is no cloud fallback and no telemetry about your
                            transactions.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
