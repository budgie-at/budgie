/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Bell, Sparkles, Target } from 'reicon-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureCropBand } from '../../../../feature/component/feature-crop-band/feature-crop-band';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { FeatureVersus } from '../../../../feature/component/feature-versus/feature-versus';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function BudgetPlanningFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const storyAlt = t(
        i18n
    )`Budgie Budget details screen with 95% of the monthly limit spent and the remainder below it, above category limit cards for Housing & Utilities, Groceries over budget, Transportation and Car & Fuel`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>One monthly limit, split by category</Trans>}
                tagline={
                    <Trans>
                        Set one overall monthly limit, add per-category limits, cap everything else, and watch the cycle fill up from your
                        home screen. Every number is computed on your device.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={storyAlt} locale={lang} scene="budget-planning-2" slug="budget-planning" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>The whole month on one screen</Trans>}>
                    <Trans>
                        Budget details puts the overall limit at the top and every category limit underneath, all worked out on the device
                        from the transactions already in your ledger.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>One limit for the month</Trans>}>
                    <Trans>
                        The header carries the period the budget covers, what you have spent against the overall limit, the percentage that
                        represents and what is still left. Spending recorded on accounts in other currencies is converted into the
                        budget&apos;s currency before any of it is counted.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={storyAlt} index={0} locale={lang} scene="budget-planning-2" slug="budget-planning">
                    <FeatureStory.Callout y={0.224}>
                        <Trans>95% of the limit used</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.268}>
                        <Trans>What is still left</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>A limit per category</Trans>}>
                    <Trans>
                        Every category you gave a ceiling gets its own card under Category limits: a bar, what you have spent, what is left
                        and the limit itself. Tap one and Budgie opens the transactions behind that number for exactly this period.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={storyAlt} index={1} locale={lang} scene="budget-planning-2" slug="budget-planning">
                    <FeatureStory.Callout y={0.436}>
                        <Trans>Spent, left and limit</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Going over is obvious</Trans>}>
                    <Trans>
                        A category that passes its ceiling turns red and swaps Left for Over budget, so the overrun is a number rather than
                        a bar that quietly stops. Refunds work the other way: a returned purchase gives the budget its money back.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={storyAlt} index={2} locale={lang} scene="budget-planning-2" slug="budget-planning">
                    <FeatureStory.Callout y={0.535}>
                        <Trans>Red once the limit breaks</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.572}>
                        <Trans>How far over you are</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureCropBand
                heading={<Trans>Going over is a number, not a feeling</Trans>}
                lede={
                    <Trans>
                        A category past its limit turns red and shows exactly how far over you are. Refunds give the budget its money back.
                    </Trans>
                }
                shot={
                    <FeatureCropBand.Shot
                        alt={t(i18n)`Category limit cards: Housing & Utilities within its limit, Groceries over budget in red`}
                        locale={lang}
                        scene="budget-planning-2"
                        slug="budget-planning"
                        y={0.33}
                    >
                        <FeatureCropBand.Pin x={0.62} y={0.425} />
                        <FeatureCropBand.Pin x={0.5} y={0.535} />
                        <FeatureCropBand.Pin x={0.38} y={0.578} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>Spent, left and limit on every card</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Red the moment a limit breaks</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>How far over, in money</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureVersus
                heading={<Trans>Budgeting without the subscription</Trans>}
                lede={<Trans>Many budget apps keep your plan on their servers and charge for it. Budgie does neither.</Trans>}
            >
                <FeatureVersus.Without title={<Trans>Cloud budget apps</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Your progress is worked out on their server</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Alerts are tied to an online account</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Starting templates from a shared library</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Budgets are often the paid tier</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Budgie</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Everything is worked out on your phone</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Alerts work offline, no account</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Start from your own recent spending</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Free, no subscription</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Target} title={<Trans>Limits that match your spending</Trans>}>
                    <Trans>An overall monthly limit, per-category limits, and one cap for everything else</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Bell} title={<Trans>Alerts at 80% and 100%</Trans>}>
                    <Trans>Opt-in on-device notifications when a limit reaches 80% and again at 100%, once per period</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Sparkles} title={<Trans>Start from your own spending</Trans>}>
                    <Trans>
                        Start from a template built out of your own recent spending, from a generic starter budget, or from an empty canvas
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>The exact dates of the current cycle on both the detail screen and the home widget</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>
                            Home-screen widget with the period dates, an overall progress bar, and your closest-to-the-limit categories
                        </Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Tap any category row to open exactly the transactions behind that number for this period</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Refunds reduce what you have spent, so a returned purchase gives the budget its money back</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Spending on accounts in other currencies is converted into your budget currency</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>One limit, split the way you actually spend</Trans>}>
                    <p>
                        <Trans>
                            A Budgie budget runs on a monthly cycle, and the period it currently covers is shown on the budget detail screen
                            and on the home widget, so you always know which dates the numbers belong to.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            A budget is one overall limit plus as many per-category limits as you want, and a single cap for everything that
                            falls outside those categories. The form shows how much you have allocated, how much is left, and warns you the
                            moment your category limits exceed the overall limit.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>Alerts that never leave your phone</Trans>}>
                    <p>
                        <Trans>
                            Budget alerts are off until you turn them on. Once enabled, a background task periodically compares what you
                            have spent against your overall limit, each category limit, and the cap for everything else, and posts a local
                            notification the first time a limit reaches 80% and again when it reaches 100%.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Which alerts have already fired is remembered in on-device key-value storage, keyed by budget and period start,
                            so you get each warning once per cycle instead of a stream of duplicates. There is no server in the loop:
                            nothing about your budget, your categories, or your spending is uploaded to send these notifications.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={2} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Which budget periods are supported?</Trans>}
                    answer={
                        <Trans>
                            Monthly. Budgie tracks one active budget over a monthly cycle, and both the detail screen and the home widget
                            print the exact start and end dates of the period the numbers cover.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Do the alerts need an internet connection?</Trans>}
                    answer={
                        <Trans>
                            No. They are local notifications scheduled by the app itself from data already on your device. Nothing is sent
                            to a server, and no account is required.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>What happens with accounts in another currency?</Trans>}
                    answer={
                        <Trans>
                            The budget itself is kept in your default currency, and spending recorded on accounts in other currencies is
                            converted into it using the exchange rates stored on your device.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Do I have to build the whole budget by hand?</Trans>}
                    answer={
                        <Trans>
                            Only if you want to. Budgie can suggest a starting budget derived from your own recent transactions, offer a
                            generic starter split across common categories, or hand you an empty canvas.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={4}
                    question={<Trans>Can I see what is behind a category number?</Trans>}
                    answer={
                        <Trans>
                            Yes — tapping a category row on the budget detail screen opens the transaction list filtered to that category
                            and that exact budget period.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
