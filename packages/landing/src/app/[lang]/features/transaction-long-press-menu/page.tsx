/* eslint-disable max-lines, max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBreadcrumbsJsonLd } from '../../../../feature/component/feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
import { FeaturePageCta } from '../../../../feature/component/feature-page-cta/feature-page-cta';
import { FeaturePageFaqItem } from '../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { FeaturePageWebPageJsonLd } from '../../../../feature/component/feature-page-web-page-json-ld/feature-page-web-page-json-ld';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
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

export default async function TransactionLongPressMenuFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const description = i18n._(FEATURE_METADATA.metaDescription);
    const featureName = i18n._(FEATURE_METADATA.title);
    const title = i18n._(FEATURE_METADATA.metaTitle);
    const homePath = `/${lang}`;
    const featuresPath = `/${lang}/features`;
    const featurePath = `/${lang}/features/${FEATURE_METADATA.slug}`;

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
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={featureName}
                locale={lang}
                tagline={
                    <Trans>
                        Long-press any transaction card for a native context menu — edit, delete, split, convert to transfer, or convert
                        income to a refund without opening the full edit form.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Every change starts on the list</Trans>}>
                    <Trans>
                        Five screens: the press that opens the menu, the actions behind it, a transfer finished in one screen, and a refund
                        linked to the purchase it reverses.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Press and hold a row</Trans>}>
                    <Trans>The menu opens anchored to the card you pressed, and the rest of the list dims behind it.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie transaction list with a context menu on one card offering edit, convert to transfer, attach debt and delete`}
                    index={0}
                    locale={lang}
                    priority
                    scene="transaction-long-press-menu-1"
                    slug="transaction-long-press-menu"
                >
                    <FeatureStory.Callout y={0.3}>
                        <Trans>Hold any transaction card</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.408}>
                        <Trans>The menu opens right there</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Six actions, no form</Trans>}>
                    <Trans>
                        Edit, convert to refund, convert to transfer, attach a debt, delete, or revert — every one of them starts from the
                        list.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie context menu open over the dimmed transaction list, with delete last and marked in red`}
                    index={1}
                    locale={lang}
                    scene="transaction-long-press-menu-1"
                    slug="transaction-long-press-menu"
                >
                    <FeatureStory.Callout y={0.449}>
                        <Trans>Convert it to a transfer</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>One screen to finish it</Trans>}>
                    <Trans>
                        Convert to Transfer opens with the amount already carried over. Pick the account on the other side and you are back
                        on the list.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie convert to transfer screen with the amount prefilled and the account picker open over the from and to selectors`}
                    index={2}
                    locale={lang}
                    scene="convert-to-transfer-1"
                    slug="convert-to-transfer"
                >
                    <FeatureStory.Callout y={0.3}>
                        <Trans>The amount carries over</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.79}>
                        <Trans>Pick the destination account</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={3} title={<Trans>A refund is not income</Trans>}>
                    <Trans>
                        Counting a merchant refund as earnings inflates every income report you run. Long-press the income row, choose
                        Convert to Refund, and Budgie lists the expenses it could be reversing — same currency, any account, and never
                        smaller than the refund itself.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Convert to Refund picker listing same-currency expenses with a search field and a disabled Convert button`}
                    index={3}
                    locale={lang}
                    scene="convert-to-refund-1"
                    slug="convert-to-refund"
                >
                    <FeatureStory.Callout y={0.249}>
                        <Trans>Likeliest match sorted first</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.855}>
                        <Trans>Search by merchant or account</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={4} title={<Trans>Link it to what it reverses</Trans>}>
                    <Trans>
                        Pick the expense and convert. The refund stops standing on its own: it attaches to that purchase, the expense is
                        marked Refunded, and analytics counts the purchase net of what came back — under its original category, not as new
                        income. Tap Revert on the refunded transaction to pull the two rows apart again.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Convert to Refund picker with one expense row selected and checked, and the Convert button now enabled`}
                    index={4}
                    locale={lang}
                    scene="convert-to-refund-2"
                    slug="convert-to-refund"
                >
                    <FeatureStory.Callout y={0.249}>
                        <Trans>Pick the expense it reverses</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.907}>
                        <Trans>Convert enables on selection</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Five taps is four taps too many</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Editing a transaction in most expense apps means tapping the row to open a detail screen, then tapping an edit
                        button, then navigating form tabs, then saving, then going back. Common operations like deleting a duplicate or
                        reclassifying an expense as a transfer should not cost five taps. Budgie surfaces all of them behind a single
                        long-press gesture anchored to the transaction card itself.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The same popover menu opens on every platform, anchored to the transaction card. There is no modal, no full-screen
                        form, and no intermediate navigation step for the common actions.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Two taps from list to done — long-press plus action, no intermediate screens</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Context-aware menu — actions adapt to transaction type so you never see an invalid option</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>One popover menu on every platform — no modal, no full-screen form to open first</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Gesture-driven flow — one-handed, no toolbar hunting, no extra navigation layer</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Convert a Transaction to a Transfer</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Mistakes happen. You log a transfer as an expense, the spending stats inflate, the destination account doesn&apos;t
                        credit. Budgie&apos;s &quot;Convert to transfer&quot; action takes the existing transaction and turns it into a
                        transfer to the account you pick.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The transaction becomes a single transfer with a credit entry and a debit entry against the two accounts, balances
                        reconcile in both, and the original spending stat falls out of the analytics. No double-entry surgery from you.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>One-tap action from any transaction&apos;s long-press menu</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>One transaction carries both account entries automatically — no double-entry by you</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Spending analytics updates in place — old expense falls out cleanly</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Cross-currency conversion supported — dual-amount input after destination pick</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Fee entries on the original transaction carry over to the transfer automatically</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Convert Income to Refund</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        When a merchant refunds a purchase, the money reappears on your card as a positive transaction. Most expense
                        trackers record it as income — which is technically accurate in a cash-flow sense but misleading for actual income
                        analysis.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Budgie treats that positive transaction as a refund. It links the refund income to the original expense, supports
                        partial refunds, and keeps the audit trail visible from the transaction detail screen.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Clean income totals — refund income links back to the expense instead of counting as earnings</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Partial and full refunds — Budgie compares the refund amount with the original expense</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Cross-account manual search — find same-currency expenses even when the refund lands elsewhere</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Reversible audit trail — Revert restores the original income and expense rows</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>How do I open the menu?</Trans>}
                    answer={
                        <Trans>
                            Press and hold any transaction card for about 300ms. The native context menu appears anchored to the card.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What actions are available?</Trans>}
                    answer={
                        <Trans>
                            Edit, Convert to Refund, Convert to Transfer, Attach Debt, Delete, and Revert. The exact set depends on the
                            transaction type — only income can become a refund, for example.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I customize the menu?</Trans>}
                    answer={
                        <Trans>Not yet. The menu surfaces the most common actions; let us know on GitHub if you want a custom slot.</Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does this work on iPad?</Trans>}
                    answer={
                        <Trans>
                            Yes — the same popover menu opens on iPad, iPhone, and Android; there is no separate iPad presentation.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What does &quot;Convert to Transfer&quot; actually do?</Trans>}
                    answer={
                        <Trans>
                            The same transaction switches type to Transfer; you pick the other account, and Budgie replaces its entries with
                            a credit and a debit against the two accounts — no second transaction is created.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Will my analytics update?</Trans>}
                    answer={
                        <Trans>
                            Yes — the original spending stat falls out immediately because transfers don&apos;t count as expenses.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I undo the conversion?</Trans>}
                    answer={
                        <Trans>
                            No one-tap undo. Convert to Transfer overwrites the original entries, so reversing it means manually recreating
                            the expense or income entry yourself.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does this work for cross-currency?</Trans>}
                    answer={
                        <Trans>
                            Yes. The dual-amount input opens after picking the destination account. Original amount is preserved on the
                            source leg; destination leg gets your specified amount.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Why would I convert income to a refund?</Trans>}
                    answer={
                        <Trans>
                            Merchant refunds arrive as positive income, but they usually reverse an earlier expense. Linking the income to
                            that expense keeps income and spending analytics honest.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I refund only part of an expense?</Trans>}
                    answer={
                        <Trans>
                            Yes. Pick the original expense and Budgie marks the refund as partial when the refunded amount is lower than the
                            expense amount.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I undo a refund link?</Trans>}
                    answer={
                        <Trans>
                            Yes. Open the refunded transaction and tap Revert. The income and expense return to their original standalone
                            state.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if the expense is on another account?</Trans>}
                    answer={
                        <Trans>
                            Manual refund search can find same-currency expenses across accounts. Budgie sorts likely matches by amount and
                            date so the closest refund target appears first.
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
