/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ArrowLeftRight, Split, Zap } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { FeatureVersus } from '../../../../feature/component/feature-versus/feature-versus';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function ExpenseTrackingFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie new expense screen with the amount keypad, the account selector and the date, note, tags and category shortcuts`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Log every expense in seconds</Trans>}
                tagline={
                    <Trans>
                        Log expenses, income, and transfers in seconds with a bottom-sheet quick-entry form designed for one-handed use.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="expense-tracking-1" slug="expense-tracking" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>From an empty sheet to a list you can read</Trans>}>
                    <Trans>Three screens: saving an expense, coming back to one you already saved, and the list they all land in.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Two taps to saved</Trans>}>
                    <Trans>
                        Plus, amount, save. The account and today&apos;s date are already filled in, and a suggested category is one tap
                        away.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="expense-tracking-1" slug="expense-tracking">
                    <FeatureStory.Callout y={0.335}>
                        <Trans>Type the amount</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.87}>
                        <Trans>Then tap save</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Every action on a long-press</Trans>}>
                    <Trans>
                        Edit, convert to a transfer or refund, attach a debt or delete — whichever apply to that row. A plain tap only opens
                        the row to read, so nothing changes by accident.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie transaction list with a long-press context menu offering edit, convert to transfer, attach debt and delete`}
                    index={1}
                    locale={lang}
                    scene="transaction-long-press-menu-1"
                    slug="transaction-long-press-menu"
                >
                    <FeatureStory.Callout y={0.47}>
                        <Trans>Long-press for every action</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>The list stays scannable</Trans>}>
                    <Trans>Rows group under the month, each one carrying its category icon, its tags and the account it came from.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie transaction list grouped by month with the category, tag and account on every row`}
                    index={2}
                    locale={lang}
                    scene="expense-tracking-2"
                    slug="expense-tracking"
                >
                    <FeatureStory.Callout y={0.235}>
                        <Trans>Grouped by month</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.42}>
                        <Trans>Amounts aligned right</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureSpecTiles heading={<Trans>Built for a quick entry</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>is already the date</Trans>} value={<Trans>Today</Trans>}>
                    <Trans>Your default account is filled in too, so you type the amount and save.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>tap on a pill sets the category</Trans>} value={<Trans>One</Trans>}>
                    <Trans>Once you type a title, a suggested category appears.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>monthly bars show what is normal</Trans>} value="6">
                    <Trans>Open a transaction with similar ones to compare it.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureVersus
                heading={<Trans>Beyond the notebook</Trans>}
                lede={<Trans>A notebook or spreadsheet means retyping everything. Budgie fills in what it can.</Trans>}
            >
                <FeatureVersus.Without title={<Trans>Notebook or spreadsheet</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Type every field each time</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Easy to overwrite a row by accident</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Transfers often get counted as spending</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>No quick way to spot an odd cost</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Budgie</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Account and date are pre-filled</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>A tap reads, a long-press acts</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Transfers never count as spending</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Monthly bars compare similar transactions</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Zap} title={<Trans>Pre-filled for fast entry</Trans>}>
                    <Trans>Fast entry: account and date are pre-filled, and a suggested category is one tap away</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ArrowLeftRight} title={<Trans>Transfers never miscounted</Trans>}>
                    <Trans>Three first-class transaction types: expense, income, transfer — never confused, never miscounted</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Split} title={<Trans>One entry, several categories</Trans>}>
                    <Trans>Split one entry across several categories right in the quick-entry form</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Long-press any row for actions such as edit, delete, convert to transfer or refund, and attach a debt</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Tapping a transaction opens a read-only detail view — editing is a deliberate second step</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Six monthly bars on that view show what you usually spend at the same place, in the same category</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why entry friction kills expense trackers</Trans>}>
                    <p>
                        <Trans>
                            An expense tracker lives or dies by entry friction. Budgie&apos;s quick-entry sheet starts with your account and
                            the current date, and suggests a category you can accept with one tap.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Every entry is amount + account + category + tags + comment + date. Split an entry across categories right in
                            the quick-entry form. Long-press any transaction in the list for a menu to edit, delete, convert to a transfer,
                            or link income back to a refunded expense without leaving the screen.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>Read first, edit on purpose</Trans>}>
                    <p>
                        <Trans>
                            Opening a transaction no longer drops you into a form. You get a read-only Transaction Info view — amount,
                            account, category, tags, comment, and the details the bank sent — with editing behind an explicit button.
                            Looking something up stops being a chance to change it by accident.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            That view also answers the question a single number never can: is this normal? Six monthly bars show what you
                            spent on the same thing — same account, same category, same merchant title — over the six months leading up to
                            this transaction, with the monthly totals, a total, and an average. It appears only when there is more than one
                            match, so one-off purchases stay uncluttered.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={2} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>How fast is the quick-entry form?</Trans>}
                    answer={
                        <Trans>
                            Open the sheet, type the amount, tap save. The form starts with your account and today&apos;s date, and suggests
                            a category you can accept with one tap.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Can I edit a transaction after saving?</Trans>}
                    answer={
                        <Trans>
                            Yes. Tapping a row opens its read-only detail view with an Edit button, and long-pressing it in the list gives
                            you a menu with Edit, Delete, Convert to Transfer, Convert to Refund and more, depending on the row. Merged or
                            refunded transactions offer fewer actions, such as Revert.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>What do the monthly bars on a transaction mean?</Trans>}
                    answer={
                        <Trans>
                            They are your own spending on comparable transactions — the same account, the same category, and the same
                            merchant title — across the six months leading up to the one you are looking at, with a total and an average
                            underneath.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Does Budgie distinguish transfers from expenses?</Trans>}
                    answer={
                        <Trans>
                            Yes. Transfer is a first-class transaction type with explicit source and destination accounts; it never inflates
                            your spending stats.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={4}
                    question={<Trans>What about recurring purchases?</Trans>}
                    answer={
                        <Trans>
                            Budgie auto-detects recurring patterns and surfaces them on a dedicated calendar tab. See the Recurring Payments
                            Calendar feature for details.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
