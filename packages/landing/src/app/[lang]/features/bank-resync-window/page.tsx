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

export default async function BankResyncWindowFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Windowed Bank Re-sync</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Re-pull the last 7, 30 or 90 days from your bank instead of resetting the account and re-walking its whole history.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Rewind a week, not a year</Trans>}>
                    <Trans>
                        One sheet on the account&apos;s own settings screen: the whole history, or the last ninety, thirty or seven days.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Re-pull a slice, not everything</Trans>}>
                    <Trans>
                        Open a bank-synced account and tap Re-sync. Picking a window moves that account&apos;s sync cursor back to the date
                        you chose, so the next sync starts from there instead of walking the whole history again.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Account Settings for a bank-synced account with the re-sync sheet open on four options: re-sync entire history, last 90 days, last 30 days and last 7 days`}
                    index={0}
                    locale={lang}
                    priority
                    scene="bank-resync-window-1"
                    slug="bank-resync-window"
                >
                    <FeatureStory.Callout index={0} y={0.64}>
                        <Trans>The whole-history reset</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={0} y={0.715}>
                        <Trans>Or the last ninety days</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.863}>
                        <Trans>Seven days, one tap</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Down to the last week</Trans>}>
                    <Trans>
                        Seven days is the tightest slice on offer. Whatever comes back is matched against what you already have on the
                        bank&apos;s own transaction id and updated in place, so rows are refreshed rather than duplicated — and the category
                        and the tags you set are not part of that update.
                    </Trans>
                </FeatureStory.Step>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why a full re-sync is the wrong fix</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Sometimes a sync drifts — a transaction reconciles late, a refund posts after the fact. The blunt fix is to reset
                        the account and re-walk its entire history. Budgie&apos;s window picker rewinds only as far as you ask.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Pick the last 7, 30 or 90 days and Budgie moves that account&apos;s sync cursor back to the matching date; the next
                        sync re-fetches from there. Rows the bank sends again are matched on its own transaction id, so they are updated in
                        place instead of landing twice.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Four choices: the last 7, 30 or 90 days, or the whole history</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>The category and the tags you set are never part of what a re-sync writes</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Repeat rows are matched on the bank&apos;s transaction id, not inserted again</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>The whole-history option asks for confirmation before it clears the sync state</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Re-sync sits in each account&apos;s own settings, beside its sync switch</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Why not just full re-sync?</Trans>}
                    answer={
                        <Trans>
                            The whole-history option clears the account&apos;s entire sync state and re-walks it from the beginning, and it
                            un-merges every transfer pair Budgie had matched automatically on that account. A window rewinds a set number of
                            days and leaves everything older untouched.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What&apos;s the smallest window?</Trans>}
                    answer={
                        <Trans>
                            Seven days. Thirty and ninety are the other two presets. There is no custom date range — the sheet offers
                            exactly these four choices.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What happens to edited transactions in the window?</Trans>}
                    answer={
                        <Trans>
                            There is no conflict prompt. If the bank sends a row again with different figures, Budgie overwrites the amount,
                            the title, the comment and the date that came with it. What it never touches is the category and the tags you
                            set.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I re-sync transactions from before bank-sync was enabled?</Trans>}
                    answer={
                        <Trans>
                            Only as far back as the bank&apos;s API serves. Re-sync drives the Monobank connection; PrivatBank and Erste
                            arrive as file imports, where the range is whatever you export. CSV import is the universal fallback.
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
