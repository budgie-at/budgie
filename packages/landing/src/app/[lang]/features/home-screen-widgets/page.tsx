/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
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

export default async function HomeScreenWidgetsFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Home Screen Widgets</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Net worth, budget, and a quick way to add a transaction, right on your iPhone Home Screen. No need to open Budgie to
                        check where you stand.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Three widgets, one glance</Trans>}>
                    <Trans>Add them to your Home Screen and your numbers are already there before you unlock your phone.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Total balance, before you unlock</Trans>}>
                    <Trans>
                        The net worth widget mirrors the total at the top of Home, and the larger size adds how much it moved this month and
                        whether you are growing or burning. Tap it and Budgie opens straight to Home.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie home screen with the total balance header that the net worth widget mirrors`}
                    index={0}
                    locale={lang}
                    priority
                    scene="net-worth-tracker-1"
                    slug="net-worth-tracker"
                >
                    <FeatureStory.Callout y={0.175}>
                        <Trans>Total in your base currency</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.225}>
                        <Trans>Fiat and crypto, split out</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>How much of the month is left</Trans>}>
                    <Trans>
                        The budget widget carries the same spent, left and percentage as the budget screen, and the larger size adds your
                        top categories. Tap it and Budgie opens the budget screen for the active period.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie budget screen header showing spent, left and percentage that the budget widget mirrors`}
                    index={1}
                    locale={lang}
                    scene="budget-planning-2"
                    slug="budget-planning"
                >
                    <FeatureStory.Callout y={0.224}>
                        <Trans>Percentage of the limit used</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.268}>
                        <Trans>What is still left</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Start a transaction from your Home Screen</Trans>}>
                    <Trans>
                        The quick add widget carries three taps: expense, income and transfer. Each one jumps straight into the same
                        new-transaction screen you would reach from inside Budgie, already set to that type.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie new expense screen that a tap on the quick add expense tile opens directly`}
                    index={2}
                    locale={lang}
                    scene="expense-tracking-1"
                    slug="expense-tracking"
                >
                    <FeatureStory.Callout y={0.335}>
                        <Trans>Type the amount</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.87}>
                        <Trans>Then tap save</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Locked when you are, current when it matters</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Set a PIN and every amount on every widget turns into dots. The layout stays, so you still see that a budget is
                        running low or that net worth moved, just not the figures themselves.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Widgets pick up an add, edit or sync as soon as iOS lets them refresh, and keep refreshing in the background so the
                        numbers stay close to current even while Budgie stays closed.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Net worth and budget come in a small size for just the headline number, or a larger size that adds the detail
                        underneath. Quick add is one size, sized for its three tiles.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Which widgets does Budgie offer?</Trans>}
                    answer={
                        <Trans>
                            Three: net worth, budget, and quick add. Net worth and budget come in a small and a larger size, and quick add
                            comes in one size with three tiles for expense, income and transfer.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Do the widgets update on their own?</Trans>}
                    answer={
                        <Trans>
                            Yes. They refresh right after a transaction changes inside Budgie, and again periodically in the background, so
                            you do not need to open the app to see a current number.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can anyone read my amounts by looking at my Home Screen?</Trans>}
                    answer={
                        <Trans>
                            Not if you have a PIN set. Every amount on every widget is replaced with dots the moment a PIN is on, with no
                            separate switch to remember.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What does the budget widget show if I have no active budget?</Trans>}
                    answer={<Trans>A short message instead of numbers, so an empty widget never looks like a zero balance.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>Where does tapping a widget take me?</Trans>}
                    answer={
                        <Trans>
                            The net worth widget opens Home, the budget widget opens the budget screen, and each quick add tile opens the
                            new-transaction screen already set to expense, income or transfer.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Do I need to keep Budgie open for the numbers to stay right?</Trans>}
                    answer={
                        <Trans>
                            No. Widgets are built to be read closed. They pick up every change you make inside the app and keep themselves
                            current on a schedule in the background.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
