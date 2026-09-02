/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBreadcrumbsJsonLd } from '../../../../feature/component/feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
import { FeaturePageComparisonTable } from '../../../../feature/component/feature-page-comparison-table/feature-page-comparison-table';
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

export default async function BudgetPlanningFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Budget Planning — Limits That Match Your Payday</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Set one overall monthly limit, add per-category limits, cap everything else, and watch the cycle fill up from your
                        home screen. Every number is computed on your device.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>A budget cycle should start when your money arrives</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Most budget apps assume the first of the month. Budgie lets you pick any start day for the cycle, or anchor it to
                        the last day of each month, so the period you plan against is the period you actually get paid for.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        A budget is one overall limit plus as many per-category limits as you want, and a single cap for everything that
                        falls outside those categories. The form shows how much you have allocated, how much is left, and warns you the
                        moment your category limits exceed the overall limit.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>An overall monthly limit, per-category limits, and one cap for everything else</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Payday-aligned cycles — start on any day of the month or anchor to the last day</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>
                            Home-screen widget with the period dates, an overall progress bar, and your closest-to-the-limit categories
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Opt-in on-device notifications when a limit reaches 80% and again at 100%, once per period</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>
                            Start from a template built out of your own recent spending, from a generic starter budget, or from an empty
                            canvas
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>Tap any category row to open exactly the transactions behind that number for this period</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={6}>
                        <Trans>Refunds reduce what you have spent, so a returned purchase gives the budget its money back</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={7}>
                        <Trans>Spending on accounts in other currencies is converted into your budget currency</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Alerts that never leave your phone</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Budget alerts are off until you turn them on. Once enabled, a background task periodically compares what you have
                        spent against your overall limit, each category limit, and the cap for everything else, and posts a local
                        notification the first time a limit reaches 80% and again when it reaches 100%.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Which alerts have already fired is remembered in on-device key-value storage, keyed by budget and period start, so
                        you get each warning once per cycle instead of a stream of duplicates. There is no server in the loop: nothing about
                        your budget, your categories, or your spending is uploaded to send these notifications.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Create a budget, pick the day the cycle starts, and set an overall limit in your default currency. Add limits to the
                        categories you care about and a cap for the rest. The detail screen breaks the period down category by category; the
                        home widget keeps the headline numbers one glance away, and can be hidden from Settings whenever you want the home
                        screen quiet.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Subscription budget apps vs. Budgie</Trans>
                </FeaturePageHeading>
                <FeaturePageComparisonTable rivalLabel={<Trans>Cloud budget app</Trans>}>
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>Any start day, or the last day of the month</Trans>}
                        concern={<Trans>Cycle start</Trans>}
                        rival={<Trans>Usually locked to the 1st</Trans>}
                    />
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>Computed on-device from your local database</Trans>}
                        concern={<Trans>Where progress is calculated</Trans>}
                        rival={<Trans>On a server that mirrors your transactions</Trans>}
                    />
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>Local notifications, opt-in, deduped per period</Trans>}
                        concern={<Trans>Limit alerts</Trans>}
                        rival={<Trans>Server-side push tied to an account</Trans>}
                    />
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>Free, no account, no subscription</Trans>}
                        concern={<Trans>Cost of budgeting</Trans>}
                        rival={<Trans>Often the paid tier</Trans>}
                    />
                </FeaturePageComparisonTable>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Which budget periods are supported?</Trans>}
                    answer={
                        <Trans>
                            Monthly. What you choose is where the month begins — any day of the month, or the last day — so the cycle can
                            follow your payday instead of the calendar.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Do the alerts need an internet connection?</Trans>}
                    answer={
                        <Trans>
                            No. They are local notifications scheduled by the app itself from data already on your device. Nothing is sent
                            to a server, and no account is required.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What happens with accounts in another currency?</Trans>}
                    answer={
                        <Trans>
                            The budget itself is kept in your default currency, and spending recorded on accounts in other currencies is
                            converted into it using the exchange rates stored on your device.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Do I have to build the whole budget by hand?</Trans>}
                    answer={
                        <Trans>
                            Only if you want to. Budgie can suggest a starting budget derived from your own recent transactions, offer a
                            generic starter split across common categories, or hand you an empty canvas.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I see what is behind a category number?</Trans>}
                    answer={
                        <Trans>
                            Yes — tapping a category row on the budget detail screen opens the transaction list filtered to that category
                            and that exact budget period.
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
