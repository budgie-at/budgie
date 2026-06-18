/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBreadcrumbsJsonLd } from '../../../../feature/component/feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
import { FeaturePageCta } from '../../../../feature/component/feature-page-cta/feature-page-cta';
import { FeaturePageFaqItem } from '../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
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

export default async function AccountManagementFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Multi-Account Money Management</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Track unlimited bank accounts, cash wallets, savings, crypto, stocks, and debt — grouped, archived, and renamed
                        however you want.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why real life is multi-account</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Real life is multi-account. A current account, a savings pot, a Revolut card, a crypto wallet, a parental loan.
                        Budgie treats each as a first-class account with its own currency, type, balance, and &ldquo;include in net
                        worth&rdquo; toggle.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Bank-synced accounts auto-group by provider on the home screen. Liability and debt accounts support negative
                        balances. Archived accounts disappear from the home but stay searchable.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Unlimited accounts: Bank, Cash, Crypto, Stocks, Debt — each with its own currency and balance</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Bank-synced accounts auto-group by provider on the home screen</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Liability and debt accounts support negative balances and a target return date</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Archive without deleting — old accounts disappear from the home but stay searchable</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>&ldquo;Include in net worth&rdquo; toggle per account for partial-truth balance sheets</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Create accounts manually or via bank sync. Each account belongs to one of: Bank, Cash, Crypto, Stocks, Debt.
                        Reorder, rename, archive, or permanently delete from the account detail page.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Is there a limit on the number of accounts?</Trans>}
                    answer={
                        <Trans>
                            No. Add as many as you need — the home screen organizes them by type and provider so the list stays scannable.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I track an account in a different currency?</Trans>}
                    answer={
                        <Trans>
                            Yes. Each account has a fixed currency. Daily exchange-rate snapshots convert everything to your base currency
                            for net worth.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What happens to transactions when I delete an account?</Trans>}
                    answer={
                        <Trans>
                            Budgie prompts you to migrate them to another account or wipe them. Archiving is the safer alternative — it
                            hides the account from the home but keeps the data.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I track loans I owe or money owed to me?</Trans>}
                    answer={
                        <Trans>
                            Yes. Debt is a dedicated account type with explicit &ldquo;I owe&rdquo; / &ldquo;owes me&rdquo; direction. See
                            Debt &amp; Loan Tracking for details.
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
