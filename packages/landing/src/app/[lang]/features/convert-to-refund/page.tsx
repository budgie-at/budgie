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

export default async function ConvertToRefundFeaturePage(props: PageLangParam) {
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
                        Refund income should reduce the expense it reverses, not inflate your income. Link it back to the original purchase
                        in one tap.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>The money came back — it was never earned</Trans>}>
                    <Trans>
                        Two screens: the same-currency expenses this income could be paying back, and the one you pick for it to cancel out.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>A refund is not income</Trans>}>
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
                    index={0}
                    locale={lang}
                    priority
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

                <FeatureStory.Step index={1} title={<Trans>Link it to what it reverses</Trans>}>
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
                    index={1}
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
                    <Trans>Why refunds pollute income analytics</Trans>
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
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
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
