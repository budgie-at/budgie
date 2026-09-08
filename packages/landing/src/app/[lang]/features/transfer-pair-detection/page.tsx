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

export default async function TransferPairDetectionFeaturePage(props: PageLangParam) {
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
                        Budgie consolidates obvious transfers and merchant refunds automatically, and leaves anything ambiguous exactly as
                        it imported it.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Two rows, one movement</Trans>}>
                    <Trans>
                        Two screens: the list where a matched pair reads as a single transfer, and the sheet that still holds both originals
                        behind it.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Both accounts report the same move</Trans>}>
                    <Trans>
                        Sync the account the money left and the account it landed in, and each one imports its own leg — an expense on one
                        side, an income on the other. Left alone, one movement lands in your ledger twice.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie transaction list where a matched transfer pair appears as one incoming transfer row naming the destination account`}
                    index={0}
                    locale={lang}
                    priority
                    scene="transfer-pair-detection-1"
                    slug="transfer-pair-detection"
                >
                    <FeatureStory.Callout index={0} y={0.667}>
                        <Trans>One transfer row, not two</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.732}>
                        <Trans>Named by its destination account</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>The obvious pairs merge on import</Trans>}>
                    <Trans>
                        An expense pairs with an income when the counter-IBAN lines up, or when the amounts match — same currency, or an
                        implied exchange rate inside a tolerance band — and both legs fall within twelve hours of each other. The match
                        becomes one transfer carrying a debit and a credit entry, so it stops counting as spending. Pairs Budgie is not sure
                        about are left alone as two rows rather than guessed at.
                    </Trans>
                </FeatureStory.Step>

                <FeatureStory.Step index={2} title={<Trans>See what merged, and undo it</Trans>}>
                    <Trans>
                        A merged transfer keeps a Consolidation row. &quot;View source transactions&quot; opens both originals with their
                        amounts, dates and accounts still intact. Revert puts them back and removes the merged transfer.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie merged transfer screen with the consolidation source sheet listing both original legs above Done and Revert`}
                    index={2}
                    locale={lang}
                    scene="transfer-pair-detection-2"
                    slug="transfer-pair-detection"
                >
                    <FeatureStory.Callout y={0.596}>
                        <Trans>Every merge keeps its sources</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.816}>
                        <Trans>The other leg, still there</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.878}>
                        <Trans>Revert restores both originals</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why imported transactions need consolidation</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Two synced banks see the same transfer twice — once as a debit, once as a credit. Without consolidation, your
                        spending doubles. Budgie matches the pair using amount, time window, and the counter-IBAN stored on each leg.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Refunds have the opposite problem: a merchant credit can look like income even though it reverses an earlier
                        expense. Budgie consolidates clear refund matches automatically and leaves uncertain cases exactly as they arrived.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Counter-IBAN stored per leg — primary signal for cross-account matching</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Amount + time-window matching catches transfers and refunds without perfect bank metadata</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Cross-currency: $1000 → €925 matches when the implied exchange rate is plausible</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Ambiguous matches stay as two untouched rows instead of a silent guess</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Original entries stay linked under the consolidated transaction for full audit trail</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>What if the algorithm misidentifies a match?</Trans>}
                    answer={
                        <Trans>
                            Manual override is one tap. Open the consolidated transaction, choose Revert, and Budgie restores the original
                            entries with their original categories.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does this work across two different banks?</Trans>}
                    answer={
                        <Trans>
                            Yes — that&apos;s the whole point. Counter-IBAN is the primary matching signal: both banks store the
                            counterparty IBAN on their respective legs, so Budgie can link them directly. Monobank, PrivatBank, and Erste
                            all expose counter-IBAN. For cross-currency pairs, an exchange-rate tolerance band confirms the match when the
                            amounts differ due to FX conversion.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What about cross-currency transfers?</Trans>}
                    answer={
                        <Trans>
                            Pairs match if the implied FX rate falls within a plausible tolerance band. Cross-currency legs have to land
                            within a minute of each other; same-currency pairs get a twelve-hour window. The original amounts in both
                            currencies are preserved on each leg.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Will old (already-imported) transactions get re-matched?</Trans>}
                    answer={
                        <Trans>
                            Yes. Each consolidation run rescans recent entries against existing ones, so transfers and refunds can match
                            retroactively when enough matching info arrives.
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
