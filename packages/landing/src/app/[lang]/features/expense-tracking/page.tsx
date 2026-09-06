/* eslint-disable max-lines-per-function */
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

export default async function ExpenseTrackingFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Expense Tracking, Reimagined</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Log expenses, income, and transfers in seconds with a bottom-sheet quick-entry form designed for one-handed use.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>From an empty sheet to a list you can read</Trans>}>
                    <Trans>Three screens: saving an expense, coming back to one you already saved, and the list they all land in.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Two taps to saved</Trans>}>
                    <Trans>Plus, amount, save. The account, today&apos;s date and the likely category are already filled in for you.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie new expense screen with the amount keypad, the account selector and the date, note, tags and category shortcuts`}
                    index={0}
                    locale={lang}
                    priority
                    scene="expense-tracking-1"
                    slug="expense-tracking"
                >
                    <FeatureStory.Callout y={0.29}>
                        <Trans>Type the amount</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.87}>
                        <Trans>Then tap save</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Every action on a long-press</Trans>}>
                    <Trans>
                        Edit, convert to a transfer, attach a debt or delete. A plain tap only opens the row to read, so nothing changes by
                        accident.
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

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why entry friction kills expense trackers</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        An expense tracker lives or dies by entry friction. Budgie&apos;s quick-entry sheet picks the right account, the
                        most-likely category, and the current date by default — typically two taps to a saved transaction.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Every entry is amount + account + category + tags + comment + date. Long-press any transaction in the list for a
                        context menu. Edit, delete, split, convert to a transfer, or link income back to a refunded expense without leaving
                        the screen.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Two-tap entry: smart defaults for account, category, and date pick the right values out of the box</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Three first-class transaction types: expense, income, transfer — never confused, never miscounted</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Long-press any row for context actions: edit, delete, split, convert to transfer, convert to refund</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>MCC pre-fill on bank-synced transactions; AI category suggestion on manual entries</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Comments grow vertically up to two lines so receipts and references fit without truncation</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>Tapping a transaction opens a read-only detail view — editing is a deliberate second step</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={6}>
                        <Trans>Six monthly bars on that view show what you usually spend at the same place, in the same category</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Read first, edit on purpose</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Opening a transaction no longer drops you into a form. You get a read-only Transaction Info view — amount, account,
                        category, tags, comment, and the details the bank sent — with editing behind an explicit button. Looking something
                        up stops being a chance to change it by accident.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        That view also answers the question a single number never can: is this normal? Six monthly bars show what you spent
                        on the same thing — same account, same category, same merchant title — over the six months leading up to this
                        transaction, with the monthly totals, a total, and an average. It appears only when there is more than one match, so
                        one-off purchases stay uncluttered.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>How fast is the quick-entry form?</Trans>}
                    answer={
                        <Trans>
                            Open the sheet, type the amount, tap save — that&apos;s the typical flow once defaults are tuned to your habits.
                            The form picks your default account, the most-likely category, and today&apos;s date automatically.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I edit a transaction after saving?</Trans>}
                    answer={
                        <Trans>
                            Always. Tapping a row opens its read-only detail view with an Edit button, and long-pressing it in the list
                            gives you a context menu with Edit, Delete, Split, Convert to Transfer, and Convert to Refund actions when they
                            apply.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What do the monthly bars on a transaction mean?</Trans>}
                    answer={
                        <Trans>
                            They are your own spending on comparable transactions — the same account, the same category, and the same
                            merchant title — across the six months leading up to the one you are looking at, with a total and an average
                            underneath.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does Budgie distinguish transfers from expenses?</Trans>}
                    answer={
                        <Trans>
                            Yes. Transfer is a first-class transaction type with explicit source and destination accounts; it never inflates
                            your spending stats.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What about recurring purchases?</Trans>}
                    answer={
                        <Trans>
                            Budgie auto-detects recurring patterns and surfaces them on a dedicated calendar tab. See the Recurring Payments
                            Calendar feature for details.
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
