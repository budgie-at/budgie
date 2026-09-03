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
import { FeaturePageMedia } from '../../../../feature/component/feature-page-media/feature-page-media';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
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

export default async function DepositTrackingFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Deposit Tracking</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Track fixed-term savings as deposit accounts kept separate from everyday spending, with interest rate, maturity
                        date, days remaining, and expected payout.
                    </Trans>
                }
            />

            <FeaturePageMedia>
                <AppShot
                    alt={t(i18n)`Budgie term deposit screen with the interest rate, maturity date and expected payout`}
                    locale={lang}
                    scene="deposit-tracking-1"
                    slug="deposit-tracking"
                />
            </FeaturePageMedia>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why deposits need their own account type</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        A deposit is not everyday cash. Budgie treats it as a distinct account type so the principal stays separate from
                        normal spending accounts while still appearing in your broader account list.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Deposit accounts store an optional annual interest rate and maturity date. The account details screen uses those
                        fields to show days remaining and an expected payout estimate, without pretending interest has automatically posted.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Dedicated Deposit account type for fixed-term savings and locked principal</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Interest rate and maturity date fields for each deposit account</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Days remaining and expected payout shown from your balance, rate, and maturity date</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Close a deposit into a selected destination account with a transfer, then archive it</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Deposit principal is protected from normal expense spending and cannot go negative</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>&ldquo;Include in net worth&rdquo; stays available when a deposit should or should not count</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Create a Deposit account manually or from a bank integration. Add its current balance, currency, interest rate, and
                        maturity date so Budgie can show the deposit details alongside your other accounts.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        When the deposit matures, choose the destination account and close it. Budgie transfers the remaining balance from
                        the deposit account and archives the deposit so it leaves the home screen without losing history.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Can I spend from a deposit account?</Trans>}
                    answer={
                        <Trans>
                            No. Deposit accounts are excluded from normal expense source selection, and Budgie prevents deposit balances
                            from becoming negative.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does Budgie automatically accrue deposit interest?</Trans>}
                    answer={
                        <Trans>
                            No. Budgie stores the interest rate and maturity date, then calculates an expected payout estimate from the
                            current balance and days remaining. It does not automatically create interest transactions.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How do I close a deposit?</Trans>}
                    answer={
                        <Trans>
                            Use the Close Deposit action, select the destination account, and confirm. Budgie transfers the remaining
                            deposit balance to that account and archives the deposit.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can deposits be included in net worth?</Trans>}
                    answer={
                        <Trans>
                            Yes. Like other accounts, deposits have an &ldquo;include in net worth&rdquo; setting, so you can decide whether
                            a locked deposit belongs in your net worth view.
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
