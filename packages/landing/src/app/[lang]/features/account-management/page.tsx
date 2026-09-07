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
                        Track unlimited bank accounts, cash wallets, deposits, crypto, and debt — grouped, colored, archived, and renamed
                        however you want.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Many accounts, one balance sheet</Trans>}>
                    <Trans>
                        Three screens: the home list grouped by type, the form a new account type brings with it, and the archive that keeps
                        the accounts you closed.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Accounts group themselves by type</Trans>}>
                    <Trans>
                        Bank, cash, crypto, deposit and debt each get their own section on the home screen, and every section heading
                        carries the subtotal for the accounts under it.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie home screen with accounts grouped into Bank and Cash sections, each heading showing its own subtotal`}
                    index={0}
                    locale={lang}
                    priority
                    scene="account-management-1"
                    slug="account-management"
                >
                    <FeatureStory.Callout y={0.177}>
                        <Trans>Total balance up top</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.436}>
                        <Trans>Every group carries a subtotal</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Each type brings its own form</Trans>}>
                    <Trans>
                        Picking Deposit opens the deposit form: opening balance, name, currency — then an interest rate and a maturity date
                        that only this type asks for.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie new deposit account form with currency, interest rate and maturity date fields`}
                    index={1}
                    locale={lang}
                    scene="account-management-3"
                    slug="account-management"
                >
                    <FeatureStory.Callout y={0.473}>
                        <Trans>Currency is fixed per account</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.595}>
                        <Trans>Interest rate, deposits only</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Archive instead of deleting</Trans>}>
                    <Trans>
                        An archived account leaves the home screen and the totals but keeps every transaction. Settings lists them, ready to
                        search and restore.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie archived accounts screen listing two archived accounts, each with a restore button`}
                    index={2}
                    locale={lang}
                    scene="account-management-2"
                    slug="account-management"
                >
                    <FeatureStory.Callout y={0.221}>
                        <Trans>Restore in one tap</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.832}>
                        <Trans>Search what you archived</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why real life is multi-account</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Real life is multi-account. A current account, a savings pot, a fixed-term deposit, a Revolut card, a crypto wallet,
                        a parental loan. Budgie treats each as a first-class account with its own currency, type, balance, and
                        &ldquo;include in net worth&rdquo; toggle.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Bank-synced accounts auto-group by provider on the home screen. Self-custodied crypto holdings group by currency
                        instead — several accounts holding the same coin collapse into one row with a combined balance, an expand toggle,
                        and a link straight to that coin&rsquo;s market screen. Liability and debt accounts support negative balances.
                        Archived accounts disappear from the home but stay searchable.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Archive is not the same as inactive</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Two ways to get an account out of the way, for two different reasons. Archive it when you are done with it — an
                        archived account leaves the home screen and the totals but keeps every transaction, ready to search and restore.
                        Mark it inactive when it is still real but should not clutter the home screen — an inactive account stays out of the
                        daily list without being treated as closed. Both keep the full history.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>
                            Unlimited accounts: Checking, Savings (cash), Crypto, Debt, Deposit — plus bank and Binance sync — each with its
                            own currency and balance
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Bank-synced accounts auto-group by provider on the home screen</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>
                            Self-custodied coins group by currency with one combined balance and a tap through to that coin&rsquo;s market
                            screen; exchange-synced coins stay under their exchange
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Deposit accounts track maturity details; liability and debt accounts support negative balances</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Archive without deleting, or mark inactive without archiving — both keep the full history</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>
                            Every account type carries its own color and icon, so a home screen with a dozen accounts still reads at a
                            glance
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={6}>
                        <Trans>&ldquo;Include in net worth&rdquo; toggle per account for partial-truth balance sheets</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
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
                    question={<Trans>Can I track fixed-term deposits?</Trans>}
                    answer={
                        <Trans>
                            Yes. Deposit is a dedicated account type with interest rate, maturity date, days remaining, expected payout, and
                            a Close Deposit action that transfers the balance to a selected destination account.
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
                <FeaturePageFaqItem
                    question={<Trans>What is the difference between archived and inactive?</Trans>}
                    answer={
                        <Trans>
                            Archive means you are done with the account — it leaves the home screen and the totals for good, but every
                            transaction stays searchable and restorable from Settings. Inactive means the account is still real but should
                            not clutter the home screen right now — it can be re-activated at any time from the same Settings screen.
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
