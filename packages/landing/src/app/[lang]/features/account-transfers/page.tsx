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

export default async function AccountTransfersFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Account Transfers — Done Right</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Move money between your own accounts with automatic FX conversion and dual-amount display for cross-currency
                        transfers.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Money moved, not money spent</Trans>}>
                    <Trans>
                        Three screens: the transfer form that names both accounts, the cross-currency pair with the rate it converted at,
                        and the analytics that counted neither side.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>A transfer is its own type</Trans>}>
                    <Trans>
                        You enter the amount once and pick both accounts on one row. Budgie saves a single transfer that debits one account
                        and credits the other — not an expense here and an income there that you have to remember to cancel out.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie New Transfer screen with 250 entered above a row naming Main Checking as the source and Cash Wallet as the destination`}
                    index={0}
                    locale={lang}
                    priority
                    scene="account-transfers-1"
                    slug="account-transfers"
                >
                    <FeatureStory.Callout y={0.292}>
                        <Trans>One amount, entered once</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.578}>
                        <Trans>Both accounts on one row</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Two amounts, one rate</Trans>}>
                    <Trans>
                        When the accounts hold different currencies, what will land on the other side appears under the figure you typed.
                        The pill says which side you are driving — tap it to type the receiving amount instead — and the rate that produced
                        the pair is saved with the transfer.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie New Transfer screen converting 250 US dollars into euros, with the sending-currency pill and the conversion rate row`}
                    index={1}
                    locale={lang}
                    scene="account-transfers-2"
                    slug="account-transfers"
                >
                    <FeatureStory.Callout y={0.3}>
                        <Trans>Pin the side you type</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.605}>
                        <Trans>The rate it converted at</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Neither side counts as spending</Trans>}>
                    <Trans>
                        Analytics reads income and expense transactions only, so a transfer never inflates either total and never turns up
                        as a category. The one part that does count is a fee you attach to the transfer, because that money really did
                        leave.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie analytics screen where the spent and income totals and the category breakdown contain no transfer entries`}
                    index={2}
                    locale={lang}
                    scene="spending-analytics-1"
                    slug="spending-analytics"
                >
                    <FeatureStory.Callout y={0.32}>
                        <Trans>Spent and income stay clean</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.486}>
                        <Trans>Only real income appears here</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why transfers must be a first-class type</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Transfers between your accounts are not income or expenses — and an app that treats them as such will mis-state your
                        spending. Budgie has a first-class Transfer transaction type with explicit source and destination accounts.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        For cross-currency transfers (e.g. USD to EUR), Budgie shows both amounts side by side and lets you pin either side.
                        Switch the &ldquo;currency mode&rdquo; pill to drive the conversion from send or receive direction.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>First-class Transfer transaction type — never confused with expense or income</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Cross-currency dual-amount display: pin send or receive, system computes the other</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>The exchange rate is saved with the transfer, so both balances reconcile exactly</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Currency-mode pill switches whether you drive from send or receive direction</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Convert any expense or income to a transfer retroactively — no re-entry needed</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Why is &ldquo;transfer&rdquo; a separate type?</Trans>}
                    answer={
                        <Trans>
                            Money moved between your own accounts is not income or expense. Treating transfers as expenses double-counts
                            your spending. Budgie&apos;s first-class Transfer type keeps your stats accurate.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What about cross-currency transfers?</Trans>}
                    answer={
                        <Trans>
                            Both amounts are shown together (e.g. $1000 → €925). Pin either side; the exchange rate is saved on the transfer
                            so reconciliation across currencies stays exact.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I auto-link transfers from my bank?</Trans>}
                    answer={
                        <Trans>
                            Yes — see Smart Transfer Consolidation. Bank-synced debits and credits matching by amount, time window, and
                            counter-IBAN auto-merge into a single transfer.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I undo a transfer?</Trans>}
                    answer={
                        <Trans>
                            Long-press the transfer in the list and Edit or Delete. There is no second transaction to chase — editing or
                            deleting the transfer moves both account balances back together.
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
