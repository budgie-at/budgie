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

export default async function DebtTrackingFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Debt & Loan Tracking</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        That €200 you lent your sister, the €1500 you owe a friend — first-class accounts with target balances, return
                        dates, and contact assignment.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Loans between people are accounts too</Trans>}>
                    <Trans>
                        Budgie tracks money you owe and money owed to you as first-class accounts, with a direction, a due date and a
                        running balance — and every euro that moves is a real expense or income, filed under Lending or Borrowing.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Money you owe, money owed to you</Trans>}>
                    <Trans>
                        Home groups debts by direction: You owe and Owed to you, each with its own subtotal and a bar for how far the debt
                        has been settled.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie home screen scrolled to the You owe and Owed to you debt sections, each with a subtotal and a progress bar`}
                    index={0}
                    locale={lang}
                    priority
                    scene="debt-tracking-1"
                    slug="debt-tracking"
                >
                    <FeatureStory.Callout y={0.321}>
                        <Trans>Money you owe</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.565}>
                        <Trans>Money owed to you</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>A due date and a target</Trans>}>
                    <Trans>
                        Open a debt to see what is still to receive, how much has come back and the total you lent, against the target
                        balance and return date.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie debt account screen for Lent to Daniel showing $750 still to receive at 37.5% returned, with the returned and lent totals`}
                    index={1}
                    locale={lang}
                    scene="debt-tracking-2"
                    slug="debt-tracking"
                >
                    <FeatureStory.Callout y={0.238}>
                        <Trans>Still to receive</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.287}>
                        <Trans>Returned vs lent</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Attach a repayment you already logged</Trans>}>
                    <Trans>
                        When a repayment lands as ordinary income, open the transaction and pick the debt it belongs to. Budgie files it
                        under Lending or Borrowing and moves the debt&apos;s remaining balance, instead of you recording a second
                        transaction.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie income transaction detail with a debt account picker listing Lent to Daniel and Borrowed from Mom`}
                    index={2}
                    locale={lang}
                    scene="debt-tracking-3"
                    slug="debt-tracking"
                >
                    <FeatureStory.Callout y={0.708}>
                        <Trans>Attach to a debt</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.798}>
                        <Trans>Lent or borrowed</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why inter-personal debt deserves its own account type</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Inter-personal debt is invisible to most apps. Budgie has Debt as a real account type, with explicit &quot;I
                        owe&quot; / &quot;owes me&quot; direction, optional contact, target return date, and target balance.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Net worth respects debt direction: liabilities reduce, receivables increase. But no transaction ever touches the
                        debt account itself. Lending money books an expense; a repayment books an income — both on the account the money
                        actually moved through, both filed under Lending or Borrowing. The debt account only keeps score: remaining against
                        repaid, until you archive it.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Explicit direction: &quot;I owe&quot; vs &quot;owes me&quot; — net worth signs them correctly</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Optional contact name — track inter-personal loans without spreadsheets</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Target balance and return date for closing the loop</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>
                            Lending and repayments are categorized Lending or Borrowing automatically, and count toward your monthly
                            spending and income
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Archive when settled — debt drops off the home screen but stays in history</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>Attach an existing income or expense to a debt as a repayment, without inventing a second transaction</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={6}>
                        <Trans>Debts in another currency are valued with the exchange rate from the day the money actually moved</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Attach a repayment you already recorded</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Repayments rarely arrive labelled. A friend sends money back and it lands in your account as ordinary income long
                        before you think about the debt. Attach that transaction to the debt instead of re-entering it: Budgie files it
                        under Lending or Borrowing and moves the debt&apos;s remaining balance, while it stays exactly where your bank put
                        it and keeps counting as income.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>What&apos;s the difference between &quot;I owe&quot; and &quot;owes me&quot;?</Trans>}
                    answer={
                        <Trans>
                            Direction. &quot;I owe&quot; is a liability — your net worth subtracts it. &quot;Owes me&quot; is a receivable —
                            your net worth adds it. Same account type, opposite sign.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I link a debt to a contact?</Trans>}
                    answer={
                        <Trans>
                            Yes — each debt account has an optional contact name. Useful for tracking inter-personal loans without
                            spreadsheets.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How do I settle a debt?</Trans>}
                    answer={
                        <Trans>
                            Record or attach the repayment as a normal income or expense — Budgie categorizes it Lending or Borrowing and
                            moves the remaining balance. No transfer ever touches the debt account itself; archive it once it&apos;s repaid.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>My friend repaid me by bank transfer — do I have to re-enter it?</Trans>}
                    answer={
                        <Trans>
                            No. Attach the income that already arrived to the debt. Budgie categorizes it Lending automatically, moves the
                            debt&apos;s remaining balance, and the transaction stays exactly where your bank put it — still counted as
                            income.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if the loan was in a different currency?</Trans>}
                    answer={
                        <Trans>
                            The converted value is stored together with the exchange rate for the date of the operation, so an old loan
                            keeps the valuation it had when it was made instead of drifting with today&apos;s rate.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does the target return date trigger a reminder?</Trans>}
                    answer={
                        <Trans>
                            Currently it&apos;s informational — surfaced in the account detail and recurring view. Push reminders are on the
                            roadmap.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>I already had debts before this change — do I need to redo anything?</Trans>}
                    answer={
                        <Trans>
                            No. Existing debts migrate automatically the first time you open the updated app, and are recategorized as
                            Lending or Borrowing without any prompts.
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
