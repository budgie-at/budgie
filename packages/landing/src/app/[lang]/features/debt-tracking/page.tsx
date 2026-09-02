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
                        Net worth respects debt direction: liabilities reduce, receivables increase. Settling the debt is just a transfer to
                        or from the debt account; balance hits zero, you can archive.
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
                        <Trans>Settle by transfer to a real account — no awkward &quot;expense&quot; workarounds</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Archive when settled — debt drops off the home screen but stays in history</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>
                            Attach an existing income or expense to a debt as a settlement, without inventing a second transaction
                        </Trans>
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
                        before you think about the debt. Instead of deleting it and re-entering a transfer, attach that transaction to the
                        debt: it is recorded as a settlement against the debt account and the balance moves accordingly, while the original
                        transaction stays exactly where your bank put it.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Cross-currency debts valued at the right moment</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        A loan made in another currency is worth what it was worth on the day it was made, not what today&apos;s rate says.
                        Budgie stores the exchange rate used for a debt&apos;s target balance along with the converted amount, looking up
                        the rate for the operation date — or the closest earlier one it has — and bridging through your base currency when
                        there is no direct pair.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Account type Debt with sub-type &quot;I owe&quot; or &quot;owes me&quot;. Linked to a contact name (optional).
                        Settlement happens as transfers between the debt account and a real cash/bank account.
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
                            Make a transfer between the debt account and a real cash/bank account. The debt balance hits zero; archive the
                            account if you want it off the home screen.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>My friend repaid me by bank transfer — do I have to re-enter it?</Trans>}
                    answer={
                        <Trans>
                            No. Attach the income that already arrived to the debt and it counts as a settlement against that debt account.
                            The transaction itself is untouched.
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
            </FeaturePageFaqSection>

            <FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
