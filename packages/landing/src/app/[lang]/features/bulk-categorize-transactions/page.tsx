/* eslint-disable max-lines, max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ArrowRightLeft, Banknote, Dumbbell, House, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

import { CategorizeDemo } from '../../../../feature/component/categorize-demo/categorize-demo';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBreadcrumbsJsonLd } from '../../../../feature/component/feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
import { FeaturePageCta } from '../../../../feature/component/feature-page-cta/feature-page-cta';
import { FeaturePageFaqItem } from '../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageMedia } from '../../../../feature/component/feature-page-media/feature-page-media';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { FeaturePageStageHero } from '../../../../feature/component/feature-page-stage-hero/feature-page-stage-hero';
import { FeaturePageWebPageJsonLd } from '../../../../feature/component/feature-page-web-page-json-ld/feature-page-web-page-json-ld';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
import { AppShot } from '../../../../generic/component/app-shot/app-shot';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildFeaturePageMetadata({
        locale: lang,
        slug: FEATURE_METADATA.slug,
        title: i18n._(FEATURE_METADATA.metaTitle),
        description: i18n._(FEATURE_METADATA.metaDescription),
        keywords: FEATURE_METADATA.seoKeywords.join(', '),
        publishedAt: FEATURE_METADATA.publishedAt,
        updatedAt: FEATURE_METADATA.updatedAt
    });
}

export default async function BulkCategorizeTransactionsFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const description = i18n._(FEATURE_METADATA.metaDescription);
    const featureName = i18n._(FEATURE_METADATA.title);
    const title = i18n._(FEATURE_METADATA.metaTitle);
    const homePath = `/${lang}`;
    const featuresPath = `/${lang}/features`;
    const featurePath = `/${lang}/features/${FEATURE_METADATA.slug}`;
    const linkClassName = 'font-semibold underline underline-offset-4';

    return (
        <main className="flex-1">
            <FeaturePageBreadcrumbsJsonLd locale={lang} slug={FEATURE_METADATA.slug}>
                <FeaturePageBreadcrumbsJsonLd.Item name={t(i18n)`Home`} path={homePath} />
                <FeaturePageBreadcrumbsJsonLd.Item name={t(i18n)`Features`} path={featuresPath} />
                <FeaturePageBreadcrumbsJsonLd.Item name={featureName} path={featurePath} />
            </FeaturePageBreadcrumbsJsonLd>
            <FeaturePageWebPageJsonLd
                description={description}
                featureName={featureName}
                locale={lang}
                publishedAt={FEATURE_METADATA.publishedAt}
                slug={FEATURE_METADATA.slug}
                title={title}
                updatedAt={FEATURE_METADATA.updatedAt}
            />
            <FeaturePageStageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Categorize Bank Transactions in Bulk</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Budgie gathers every uncategorized transaction into one inbox, groups it by merchant and suggests a category from
                        your own past choices. One tap categorizes the whole group.
                    </Trans>
                }
            >
                <CategorizeDemo
                    label={t(
                        i18n
                    )`Animated example: six bank transactions are grouped by merchant, five are categorized with one tap and an ATM withdrawal is moved to an account.`}
                    replay={<Trans>Replay</Trans>}
                >
                    <CategorizeDemo.Header title={<Trans>Categorize</Trans>} total={6}>
                        <Trans>left</Trans>
                    </CategorizeDemo.Header>

                    <CategorizeDemo.RawRow amount={t(i18n)`−€23.15`} index={0} slot={0}>
                        <Trans>Kartenzahlung BILLA DANKT 1100 WIEN 14.03 18:42</Trans>
                    </CategorizeDemo.RawRow>
                    <CategorizeDemo.RawRow amount={t(i18n)`−€29.90`} index={1} slot={1}>
                        <Trans>Lastschrifteinzug FITINN GES.M.B.H. MDID:AT41ZZZ00000012345</Trans>
                    </CategorizeDemo.RawRow>
                    <CategorizeDemo.RawRow amount={t(i18n)`−€100.00`} index={2} slot={2}>
                        <Trans>ATM 4839**1234 WIEN FAVORITENSTR 12.03</Trans>
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

                    <CategorizeDemo.SectionLabel count={5} slot={0}>
                        <Trans>Ready to accept</Trans>
                    </CategorizeDemo.SectionLabel>
                    <CategorizeDemo.Card
                        amount={t(i18n)`−€72.92`}
                        exit="accept"
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
                        exit="accept"
                        meta={<Trans>2 transactions</Trans>}
                        slot={1}
                        title={<Trans>FITINN</Trans>}
                    >
                        <CategorizeDemo.Suggestion icon={<Dumbbell size={12} />}>
                            <Trans>Fitness</Trans>
                        </CategorizeDemo.Suggestion>
                    </CategorizeDemo.Card>

                    <CategorizeDemo.SectionLabel count={1} slot={2}>
                        <Trans>Transfers</Trans>
                    </CategorizeDemo.SectionLabel>
                    <CategorizeDemo.Card
                        amount={t(i18n)`−€100.00`}
                        exit="move"
                        icon={<Banknote size={14} />}
                        meta={<Trans>1 ATM withdrawal</Trans>}
                        slot={2}
                        title={<Trans>ATM WIEN FAVORITENSTR</Trans>}
                    >
                        <CategorizeDemo.Chip icon={<ArrowRightLeft size={12} />}>
                            <Trans>Move to account…</Trans>
                        </CategorizeDemo.Chip>
                    </CategorizeDemo.Card>

                    <CategorizeDemo.Accept>
                        <Trans>Accept 5 suggestions</Trans>
                    </CategorizeDemo.Accept>
                    <CategorizeDemo.Done title={<Trans>All caught up</Trans>}>
                        <Trans>6 categorized this session</Trans>
                    </CategorizeDemo.Done>
                </CategorizeDemo>
            </FeaturePageStageHero>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why categorizing transactions one by one never ends</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Every bank sync or statement import brings in dozens of transactions, and the same shops keep coming back under
                        slightly different descriptions: a reference number here, a card number or a date there. Categorizing them one row
                        at a time is the chore that makes people give up on a budget.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The Categorize inbox turns that chore into a short review. Every uncategorized transaction lands on one screen, rows
                        from the same merchant are grouped together, and each group gets a category suggestion based on how you categorized
                        that merchant before.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageMedia>
                <AppShot
                    alt={t(i18n)`Budgie transaction list with the missing categories pill that opens the Categorize inbox`}
                    locale={lang}
                    scene="uncategorized-transactions-1"
                    slug="uncategorized-transactions"
                />
            </FeaturePageMedia>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How the Categorize inbox works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        <strong>Open it from the pill.</strong> The{' '}
                        <Link className={linkClassName} href={`/${lang}/features/uncategorized-transactions`}>
                            missing categories pill
                        </Link>{' '}
                        above your transaction list counts what still has no category. Tap it and the inbox opens with the same account,
                        date, type, tag and amount filters you were looking at.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        <strong>Review groups, not rows.</strong> Transactions from the same merchant are grouped even when the bank adds
                        reference numbers, masked card numbers or company suffixes to the description. Each group shows how many
                        transactions it holds and what they add up to.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        <strong>Tap a suggestion.</strong> Each group offers up to two categories, ranked by how you categorized that
                        merchant before. When your past choices clearly agree, the top suggestion carries a check mark and the group sits
                        under Ready to accept. One tap, or a swipe to the right, categorizes the whole group.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        <strong>Accept everything that is certain.</strong> One button at the bottom accepts every confident suggestion at
                        once, and Undo reverses your last categorization if you change your mind. Open a group and untick any row first to
                        keep it in the inbox for later.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        <strong>Decide the rest yourself.</strong> Merchants you have never categorized land under Needs review or One-offs,
                        where you pick the category. The plain list of uncategorized transactions is always one tap away in the header.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>ATM withdrawals and card transfers are not spending</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Giving a cash withdrawal or a transfer between your own cards a category would inflate your expenses. The inbox
                        recognizes them from the bank&apos;s merchant code and the wording of the description, collects them under Transfers
                        and offers Move to account instead of a category.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        ATM withdrawals go to one of your cash accounts, card transfers to any other active account. Budgie asks you to
                        confirm, then{' '}
                        <Link className={linkClassName} href={`/${lang}/features/transaction-long-press-menu`}>
                            turns the whole group into transfers
                        </Link>{' '}
                        so your balances stay right.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Categorize a merchant once, never again</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        After you categorize a group, the bar at the bottom of the screen offers to create a rule. The rule editor opens
                        already filled in with the words the group has in common and the category you just picked.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Save it and the{' '}
                        <Link className={linkClassName} href={`/${lang}/features/categorization-rules`}>
                            categorization rule
                        </Link>{' '}
                        runs on every future bank sync and import. Budgie also offers to apply it to matching transactions you already have.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Private, and sharper every time you use it</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Suggestions are worked out on your phone from transactions you have already categorized. Nothing is uploaded, there
                        is nothing extra to download, and the inbox works offline. Every group you categorize becomes history that makes the
                        suggestions for your next import more accurate.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>One inbox for every uncategorized transaction, grouped by merchant</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Category suggestions learned from your own past choices</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Accept every confident suggestion at once, with Undo</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>ATM withdrawals and card transfers moved to the right account instead of counted as spending</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Any group turned into a rule for future imports</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>Runs entirely on your phone and works offline</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>How do I categorize several transactions at once?</Trans>}
                    answer={
                        <Trans>
                            Tap the missing categories pill above your transaction list. The Categorize inbox groups every uncategorized
                            transaction by merchant, so one tap on a suggestion categorizes the whole group, and a single button accepts
                            every confident suggestion in one go.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Where do the category suggestions come from?</Trans>}
                    answer={
                        <Trans>
                            From your own history. Budgie looks at how you categorized the same or a similar merchant before and ranks those
                            categories. Only groups where your past choices clearly agree are marked ready to accept, and nothing is sent to
                            a server.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Do I need to turn on On-device AI?</Trans>}
                    answer={<Trans>No. The Categorize inbox works with On-device AI switched off and needs no extra download.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I undo a bulk categorization?</Trans>}
                    answer={
                        <Trans>
                            Yes. After each categorization an Undo button appears at the bottom of the screen and reverses it, whether you
                            categorized a single group or accepted every suggestion at once.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What happens to ATM withdrawals and transfers between my cards?</Trans>}
                    answer={
                        <Trans>
                            They are collected under Transfers with a Move to account action instead of a category. ATM withdrawals go to a
                            cash account, card transfers to another of your accounts, and the whole group becomes transfers once you
                            confirm.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Will new transactions from the same merchant be categorized automatically?</Trans>}
                    answer={
                        <Trans>
                            Yes, once you save a rule. After categorizing a group, tap the rule button in the bar at the bottom: the rule
                            editor opens pre-filled and, once saved, categorizes matching transactions on every future bank sync and import.
                            Even without a rule, your choices make the next suggestions more accurate.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is this the same as the missing categories list?</Trans>}
                    answer={
                        <Trans>
                            It builds on it. The pill still counts uncategorized transactions under your filters, the inbox groups them for
                            fast triage, and the plain list is one tap away in the inbox header.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>

            <FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
