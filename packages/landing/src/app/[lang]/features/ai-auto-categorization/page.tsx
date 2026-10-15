/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { CloudOff, Plane, ShieldCheck, Store, TrendingUp } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureCropBand } from '../../../../feature/component/feature-crop-band/feature-crop-band';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureProof } from '../../../../feature/component/feature-proof/feature-proof';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function AiAutoCategorizationFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie new expense screen with Transportation and Groceries category pills above the Split, Date, Note, Tags and Category buttons`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Expenses sort themselves, privately</Trans>}
                tagline={
                    <Trans>
                        Category, tag, and merchant suggestions that run entirely on your phone and learn from your corrections. Your
                        statements never leave the device.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="ai-auto-categorization-1" slug="ai-auto-categorization" />
            </FeaturePageHero>

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
                    alt={firstShotAlt}
                    index={0}
                    locale={lang}
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

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(
                            i18n
                        )`Budgie Settings screen with the 100% Offline & Private card saying all your data is stored on the device`}
                        locale={lang}
                        scene="ai-auto-categorization-2"
                        slug="ai-auto-categorization"
                        y={0.16}
                    />
                }
                heading={<Trans>Check it on your own phone</Trans>}
                lede={<Trans>Suggestions are worked out on the device, so you can see for yourself that nothing leaves it.</Trans>}
            >
                <FeatureProof.Fact icon={Plane}>
                    <Trans>Turn on airplane mode: suggestions keep coming</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={CloudOff}>
                    <Trans>There is no cloud fallback to send anything to</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Source />
            </FeatureProof>

            <FeatureCropBand
                heading={<Trans>Suggestions where you type</Trans>}
                lede={<Trans>Category pills appear above the buttons on the expense form, drawn from what you have already sorted.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(i18n)`Budgie new expense screen with Transportation and Groceries category pills above the Category button`}
                        locale={lang}
                        scene="ai-auto-categorization-1"
                        slug="ai-auto-categorization"
                        y={0.33}
                    >
                        <FeatureCropBand.Pin x={0.24} y={0.44} />
                        <FeatureCropBand.Pin x={0.82} y={0.478} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>Pills from your own history</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>The full list is one tap away</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Store} title={<Trans>Remembers your merchants</Trans>}>
                    <Trans>Merchants you have categorized before are recognized instantly</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={TrendingUp} title={<Trans>Learns from every correction</Trans>}>
                    <Trans>Every correction counts on the spot — accuracy improves as you use it</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ShieldCheck} title={<Trans>Statements stay on your phone</Trans>}>
                    <Trans>Statements never leave the device — no cloud AI, no remote processing, ever</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Everything runs on your phone after a one-time download</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Card payments from an unfamiliar shop still land in the right area, using the code your bank sends</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why on-device AI is the only AI that protects your statements</Trans>}>
                    <p>
                        <Trans>
                            Cloud &ldquo;AI&rdquo; budgeting apps send every merchant name to a remote server, which means somebody
                            else&apos;s computer sees your supermarket habits. Budgie works it out on your own device — same accuracy,
                            nothing to leak.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Budgie recognizes merchants you have categorized before, spots the spending that repeats month after month, and
                            reads the merchant code your bank sends with each card payment. Every accepted or edited suggestion is taken
                            into account immediately — accuracy compounds over time.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>How a suggestion is made</Trans>}>
                    <ul>
                        <li>
                            <Trans>
                                Seen before — Budgie finds the closest match among transactions you have already categorized, which is the
                                fast path
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                Spending that repeats — rent, the commute, the weekly shop all come back with their usual category and
                                amount
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                Correction loop — every accepted or edited suggestion counts immediately, so the next similar transaction
                                lands closer without any re-training
                            </Trans>
                        </li>
                    </ul>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={2} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Does the AI work offline?</Trans>}
                    answer={
                        <Trans>
                            Yes. Everything it needs lives on your device after the one-time download. Categorization runs whether
                            you&apos;re online or not.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>How big is the download?</Trans>}
                    answer={
                        <Trans>
                            About 1.6 GB for categorization and suggestions, plus a further 0.9 GB if you turn on voice entry. Each part
                            arrives the first time you use the feature that needs it, and all of it is optional — you can keep using Budgie
                            without AI.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Can I correct the AI&apos;s suggestions?</Trans>}
                    answer={
                        <Trans>
                            Always. Every transaction lets you accept, edit, or reject the suggestion. Your corrections count immediately,
                            so the next similar transaction lands closer to the right category.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Can I turn AI off?</Trans>}
                    answer={
                        <Trans>
                            Yes. Settings has an AI section with a single On-device AI switch. Turn it off and nothing downloads, nothing
                            loads, and no suggestion runs — categorization falls back to your rules and the bank&apos;s own merchant codes.
                            New installs start with the switch off; if you were already using AI before the switch existed, it stays on.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={4}
                    question={<Trans>Does Budgie send my transactions to a cloud AI?</Trans>}
                    answer={
                        <Trans>
                            No. Everything is worked out on your own device. There is no cloud fallback and no telemetry about your
                            transactions.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
