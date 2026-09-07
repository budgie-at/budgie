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

export default async function ConvertToTransferFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Convert a Transaction to a Transfer</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Logged a payment as an expense, but it was actually money moved between your accounts? One tap reclassifies — no
                        re-entry, no balance drift.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>One row, reclassified</Trans>}>
                    <Trans>
                        Three screens: the expense that was never spending, the picker that names the other account, and the transfer the
                        row turns into.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>You logged it as an expense</Trans>}>
                    <Trans>
                        It was money moving between your own accounts, so it inflated your spending. Long-press the row and Convert to
                        Transfer is already in the menu.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie transaction list with the context menu open on an expense row, Convert to Transfer among the actions`}
                    index={0}
                    locale={lang}
                    priority
                    scene="transaction-long-press-menu-1"
                    slug="transaction-long-press-menu"
                >
                    <FeatureStory.Callout y={0.276}>
                        <Trans>Counted as money spent</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.457}>
                        <Trans>Reclassify without an edit form</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Name the account on the other side</Trans>}>
                    <Trans>
                        The amount and the source account come across from the row you pressed. Search for where the money landed, or open a
                        new deposit account funded by exactly this amount.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Convert to Transfer screen with the amount carried over and the account picker open over the from and to row`}
                    index={1}
                    locale={lang}
                    scene="convert-to-transfer-1"
                    slug="convert-to-transfer"
                >
                    <FeatureStory.Callout y={0.585}>
                        <Trans>Source account already filled in</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.719}>
                        <Trans>Or fund a new deposit</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>It reads as a transfer afterwards</Trans>}>
                    <Trans>
                        No second transaction is created — the original row changes type. A transfer names the account it moved to and stays
                        out of your expense analytics.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie transaction list showing a transfer row in green with its destination account instead of a category`}
                    index={2}
                    locale={lang}
                    scene="transfer-pair-detection-1"
                    slug="transfer-pair-detection"
                >
                    <FeatureStory.Callout y={0.667}>
                        <Trans>A transfer, not an expense</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.731}>
                        <Trans>The account it landed in</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why mistakes happen — and what to do about them</Trans>
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
                        Source-side and destination-side records are linked, balances reconcile in both, and the original spending stat
                        falls out of the analytics. No double-entry surgery from you.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>One-tap action from any transaction&apos;s long-press menu</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Source and destination legs link automatically — no double-entry by you</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Spending analytics updates in place — old expense falls out cleanly</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Cross-currency conversion supported — dual-amount input after destination pick</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Reversible: split a transfer back into two separate transactions if needed</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>What does &quot;Convert to Transfer&quot; actually do?</Trans>}
                    answer={
                        <Trans>
                            The expense (or income) becomes the source leg of a transfer; you pick the destination account, and Budgie
                            creates the destination leg automatically. Both legs are linked.
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
                            Yes. Long-press the transfer and choose &quot;Split back into two transactions&quot;; both halves return to
                            their original types.
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
            </FeaturePageFaqSection>

            <FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
