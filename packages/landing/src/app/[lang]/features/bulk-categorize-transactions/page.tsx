/* eslint-disable max-lines, max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import Link from 'next/link';
import { CheckRead, Dumbbell, House, Inbox, ShoppingCart, Sparkles, Tag } from 'reicon-react';

import { CategorizeDemo } from '../../../../feature/component/categorize-demo/categorize-demo';
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

export default async function BulkCategorizeTransactionsFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const linkClassName = 'font-semibold underline underline-offset-4';

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Categorize a whole merchant at once</Trans>}
                tagline={
                    <Trans>
                        Budgie gathers every uncategorized transaction into one inbox, groups it by merchant and suggests a category from
                        your own past choices. One tap categorizes the whole group, and a second inbox does the same for tags.
                    </Trans>
                }
            >
                <CategorizeDemo
                    caption={
                        <Trans>
                            Animated example: six bank transactions are grouped by merchant, two confident groups are categorized with one
                            tap, and the bottom panel moves from 6 left to 1 left and 5 done, with Undo.
                        </Trans>
                    }
                    replay={<Trans>Replay demo</Trans>}
                >
                    <CategorizeDemo.Header>
                        <Trans>Categorize</Trans>
                    </CategorizeDemo.Header>

                    <CategorizeDemo.RawRow amount={t(i18n)`−€23.15`} index={0} slot={0}>
                        <Trans>Kartenzahlung BILLA DANKT 1100 WIEN 14.03 18:42</Trans>
                    </CategorizeDemo.RawRow>
                    <CategorizeDemo.RawRow amount={t(i18n)`−€29.90`} index={1} slot={1}>
                        <Trans>Lastschrifteinzug FITINN GES.M.B.H. MDID:AT41ZZZ00000012345</Trans>
                    </CategorizeDemo.RawRow>
                    <CategorizeDemo.RawRow amount={t(i18n)`−€14.00`} index={2} slot={2}>
                        <Trans>Kartenzahlung MUSEUMSQUARTIER 1070 WIEN 12.03 15:20</Trans>
                    </CategorizeDemo.RawRow>
                    <CategorizeDemo.RawRow amount={t(i18n)`−€8.47`} index={3} slot={0}>
                        <Trans>BILLA DANKT 0421 K2 11.03.</Trans>
                    </CategorizeDemo.RawRow>
                    <CategorizeDemo.RawRow amount={t(i18n)`−€29.90`} index={4} slot={1}>
                        <Trans>Lastschrifteinzug FITINN GES.M.B.H. MDID:AT41ZZZ00000012345 02/26</Trans>
                    </CategorizeDemo.RawRow>
                    <CategorizeDemo.RawRow amount={t(i18n)`−€41.30`} index={5} slot={0}>
                        <Trans>Kartenzahlung BILLA DANKT 1030 WIEN 09.03 12:10</Trans>
                    </CategorizeDemo.RawRow>

                    <CategorizeDemo.SectionLabel slot={0} summary={t(i18n)`5 · −€132.72`}>
                        <Trans>Ready to accept</Trans>
                    </CategorizeDemo.SectionLabel>
                    <CategorizeDemo.Card
                        amount={t(i18n)`−€72.92`}
                        count={3}
                        meta={<Trans>3 transactions</Trans>}
                        slot={0}
                        title={<Trans>BILLA DANKT</Trans>}
                    >
                        <CategorizeDemo.Suggestion icon={<ShoppingCart size={12} />}>
                            <Trans>Groceries</Trans>
                        </CategorizeDemo.Suggestion>
                        <CategorizeDemo.Chip icon={<House size={12} />}>
                            <Trans>Household</Trans>
                        </CategorizeDemo.Chip>
                    </CategorizeDemo.Card>
                    <CategorizeDemo.Card
                        amount={t(i18n)`−€59.80`}
                        count={2}
                        meta={<Trans>2 transactions</Trans>}
                        slot={1}
                        title={<Trans>FITINN</Trans>}
                    >
                        <CategorizeDemo.Suggestion icon={<Dumbbell size={12} />}>
                            <Trans>Fitness</Trans>
                        </CategorizeDemo.Suggestion>
                    </CategorizeDemo.Card>

                    <CategorizeDemo.SectionLabel slot={2} summary={t(i18n)`1 · −€14.00`}>
                        <Trans>One-offs</Trans>
                    </CategorizeDemo.SectionLabel>
                    <CategorizeDemo.Card
                        amount={t(i18n)`−€14.00`}
                        meta={<Trans>1 transaction</Trans>}
                        slot={2}
                        title={<Trans>MUSEUMSQUARTIER</Trans>}
                    >
                        <CategorizeDemo.Chip icon={<Tag size={12} />}>
                            <Trans>Select category</Trans>
                        </CategorizeDemo.Chip>
                    </CategorizeDemo.Card>

                    <CategorizeDemo.Panel
                        done={<Trans>Categorized 5 transactions</Trans>}
                        progress={
                            <Trans>
                                <CategorizeDemo.Count from={6} to={1} /> left · <CategorizeDemo.Count from={0} to={5} /> done
                            </Trans>
                        }
                        undo={<Trans>Undo</Trans>}
                    >
                        <Trans>Accept 5 suggestions</Trans>
                    </CategorizeDemo.Panel>
                </CategorizeDemo>
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>From backlog to done in three screens</Trans>}>
                    <Trans>The count on your list, the merchant groups behind it, and the button that clears every certain one.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Start from the pill</Trans>}>
                    <Trans>
                        The pill above your transactions counts what still has no category under your filters. Tap it to open the inbox.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie transaction list with a yellow missing categories pill above the first rows`}
                    index={0}
                    locale={lang}
                    priority
                    scene="uncategorized-transactions-1"
                    slug="uncategorized-transactions"
                >
                    <FeatureStory.Callout y={0.204}>
                        <Trans>Tap to open the inbox</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Groups, not rows</Trans>}>
                    <Trans>
                        Rows from one merchant share a card, even with reference or card numbers added. The chip is what you chose before.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie Categorize screen listing merchant cards, each with a suggested category chip`}
                    index={1}
                    locale={lang}
                    scene="bulk-categorize-transactions-1"
                    slug="bulk-categorize-transactions"
                >
                    <FeatureStory.Callout y={0.214}>
                        <Trans>One card per merchant</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.265}>
                        <Trans>Learned from your past choices</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Accept everything that is certain</Trans>}>
                    <Trans>
                        Section headers stay pinned with their count and total. The bottom panel tracks progress and accepts every sure
                        group, with Undo.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`The same Budgie Categorize screen with progress and the accept all suggestions button in the bottom panel`}
                    index={2}
                    locale={lang}
                    scene="bulk-categorize-transactions-1"
                    slug="bulk-categorize-transactions"
                >
                    <FeatureStory.Callout y={0.167}>
                        <Trans>Pinned count and total</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.886}>
                        <Trans>Accept all, then Undo</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={3} title={<Trans>Tags get the same inbox</Trans>}>
                    <Trans>Open Tags in Analytics and tap Untagged. Transactions group by merchant, each with a suggested tag.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie tag inbox screen listing merchant groups, each with a suggested tag chip`}
                    index={3}
                    locale={lang}
                    scene="bulk-categorize-transactions-2"
                    slug="bulk-categorize-transactions"
                >
                    <FeatureStory.Callout y={0.265}>
                        <Trans>Tags suggested from your history</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureSpecTiles heading={<Trans>Less chore, more done</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>tap categorizes a whole merchant group</Trans>} value={<Trans>One</Trans>}>
                    <Trans>Accept the suggestion and every row from that merchant follows.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>inboxes, one for categories and one for tags</Trans>} value="2">
                    <Trans>Both work the same way, so you learn it once.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>confident suggestion accepted at once</Trans>} value={<Trans>Every</Trans>}>
                    <Trans>One button clears the sure groups. Undo reverses it.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureVersus
                heading={<Trans>Sorting by hand, or by merchant</Trans>}
                lede={<Trans>Row by row is a chore that can stall a budget.</Trans>}
            >
                <FeatureVersus.Without title={<Trans>One transaction at a time</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Open each transaction, one by one</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>The same shop keeps coming back</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Pick a category from scratch each time</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>A wrong tap can be hard to undo</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Budgie&apos;s Categorize inbox</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>One card for each merchant</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Rows from one shop share a card</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Suggested from how you chose before</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Accept all, then Undo if needed</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Inbox} title={<Trans>One inbox, grouped by merchant</Trans>}>
                    <Trans>One inbox for every uncategorized transaction, grouped by merchant</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Sparkles} title={<Trans>Suggestions from your choices</Trans>}>
                    <Trans>Category suggestions learned from your own past choices</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={CheckRead} title={<Trans>Accept all, then Undo</Trans>}>
                    <Trans>Accept every confident suggestion at once, with Undo</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>A steady list with pinned section headers showing each count and total</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Untick a row to leave it for later, or give just that row a different category</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>A tag inbox for untagged transactions, with tags suggested from your own history</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Both inboxes open from Analytics for the period you are looking at</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Any group turned into a rule for future imports</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Runs entirely on your phone and works offline</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why categorizing transactions one by one never ends</Trans>}>
                    <p>
                        <Trans>
                            Every bank sync or statement import brings in dozens of transactions, and the same shops keep coming back under
                            slightly different descriptions: a reference number here, a card number or a date there. Categorizing them one
                            row at a time is the chore that makes people give up on a budget.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            The Categorize inbox turns that chore into a short review. Every uncategorized transaction lands on one screen,
                            rows from the same merchant are grouped together, and each group gets a category suggestion based on how you
                            categorized that merchant before.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            The list holds still while you work: a group never jumps to another section or changes place, and the panel at
                            the bottom counts what is left and what is done. You can also start from{' '}
                            <Link className={linkClassName} href={`/${lang}/features/spending-analytics`}>
                                Analytics
                            </Link>
                            : tap Uncategorized under income or spending and the inbox opens with only that period and your filters.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>Tag transactions in bulk, too</Trans>}>
                    <p>
                        <Trans>
                            Tags get the same inbox. In Analytics, open the{' '}
                            <Link className={linkClassName} href={`/${lang}/features/tag-analytics`}>
                                Tags tab
                            </Link>{' '}
                            and tap Untagged: every transaction without a tag in that period is grouped by merchant, and each group gets
                            tags suggested from how you tagged that merchant before.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Accept every confident group at once, or pick several tags for one group. Undo removes exactly the tags that
                            step added and nothing else.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            In the Categorize inbox, + Tags appears right after you categorize a single group, with the tags you usually
                            give that merchant already selected, so the category and the{' '}
                            <Link className={linkClassName} href={`/${lang}/features/transaction-tags`}>
                                tags
                            </Link>{' '}
                            are done in one pass.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={2} title={<Trans>Categorize a merchant once, never again</Trans>}>
                    <p>
                        <Trans>
                            After you categorize a single group, the bar at the bottom of the screen offers to create a rule. The rule
                            editor opens already filled in with the words the group has in common and the category you just picked.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Save it and the{' '}
                            <Link className={linkClassName} href={`/${lang}/features/categorization-rules`}>
                                categorization rule
                            </Link>{' '}
                            runs on every future bank sync and import. Budgie also offers to apply it to matching transactions you already
                            have.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={3} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>How do I categorize several transactions at once?</Trans>}
                    answer={
                        <Trans>
                            Tap the missing categories pill above your transaction list, or Uncategorized in Analytics. The Categorize inbox
                            groups every uncategorized transaction by merchant, so one tap on a suggestion categorizes the whole group, and
                            a single button accepts every confident suggestion in one go.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Where do the category suggestions come from?</Trans>}
                    answer={
                        <Trans>
                            From your own history. Budgie looks at how you categorized the same or a similar merchant before and ranks those
                            categories. Only groups where your past choices clearly agree are marked ready to accept, and nothing is sent to
                            a server.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Can I tag transactions in bulk too?</Trans>}
                    answer={
                        <Trans>
                            Yes. In Analytics, open the Tags tab and tap Untagged. The tag inbox groups untagged transactions by merchant,
                            suggests tags from your own tagging history and accepts every confident group in one tap, with Undo.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Can I undo a bulk categorization?</Trans>}
                    answer={
                        <Trans>
                            Yes. After each categorization an Undo button appears at the bottom of the screen and reverses it, whether you
                            categorized a single group or accepted every suggestion at once.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={4}
                    question={<Trans>Will new transactions from the same merchant be categorized automatically?</Trans>}
                    answer={
                        <Trans>
                            Yes, once you save a rule. After you categorize a single group, tap the rule button in the bar at the bottom:
                            the rule editor opens pre-filled and, once saved, categorizes matching transactions on every future bank sync
                            and import. Even without a rule, your choices make the next suggestions more accurate.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
