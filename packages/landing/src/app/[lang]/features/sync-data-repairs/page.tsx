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

export default async function SyncDataRepairsFeaturePage(props: PageLangParam) {
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
                        When a bank sync re-delivers a transaction, or delivers one of your own transfers as two separate rows, Budgie finds
                        it and fixes it — duplicates get soft-deleted, unmatched transfer legs get paired into one.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why duplicates appear at all</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        A bank API can hand back the same transaction twice: a retried request, a resync window that overlaps the last one,
                        a connection that re-downloads a statement. Neither row is wrong on its own — they simply describe the same event,
                        and you see it twice.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The Sync Data Repairs screen runs two checks in one pass: it finds duplicate imported rows, and it looks for
                        transfers between your own cards that arrived as a separate income row and expense row instead of one transfer. It
                        checks your imported banking connections that support this repair today, shows a count before changing anything, and
                        only touches the rows involved once you confirm.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>When one card pays another</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Sometimes a transfer between your own cards arrives as two separate rows instead of one — an expense on the card
                        that sent it, an income on the card that received it. The repair finds those pairs and turns the unmatched row into
                        a proper transfer, rather than deleting anything.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        It only acts when the receiving card is no longer active on your account, when the masked card number on the
                        transaction matches exactly one of your closed cards, and when a matching entry turns up within about half a day and
                        within the expected amount. If the receiving card is still active, this repair leaves it alone — that&apos;s by
                        design, not a bug.
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
                            A dedicated Settings screen scans your imported banking connections and shows a count before it changes anything
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Soft-deletes duplicated imported rows — anything you typed yourself is never a candidate</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>
                            A per-source list, though paired own-card transfers are folded into one connection&apos;s count rather than
                            shown separately
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>No repair runs until you confirm on the repair card — no background cleanup</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>An explicit empty state, “No sync repairs found”, when there is nothing to fix</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>Runs against the local database — no upload, no server</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={6}>
                        <Trans>
                            Also pairs unmatched own-card transfer legs into a real transfer — that&apos;s a rewrite, not a deletion, and it
                            can&apos;t be undone with one tap
                        </Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>What does a sync data repair actually do?</Trans>}
                    answer={
                        <Trans>
                            It runs two fixes on your imported banking connections: it soft-deletes duplicate imported rows, and it pairs
                            transfers between your own cards that arrived as two separate rows into one. The screen shows a count before you
                            confirm anything.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Will it touch transactions I entered by hand?</Trans>}
                    answer={
                        <Trans>
                            No. The repair works on imported rows only. Manual transactions are never touched — that is exactly what the
                            confirmation card promises before you press Repair.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does it run automatically?</Trans>}
                    answer={
                        <Trans>
                            No. You open the screen, review the counts, and confirm on the repair card. Nothing changes before that.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if there is nothing to repair?</Trans>}
                    answer={<Trans>The screen says “No sync repairs found” and leaves your data alone.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>What does the own-card transfer fix actually change?</Trans>}
                    answer={
                        <Trans>
                            It doesn&apos;t delete anything. It rewrites a synced income or expense row into a transfer, pointing it at the
                            closed card that received or sent it. That&apos;s a bigger change than a duplicate soft-delete, and unlike the
                            soft-delete it has no one-tap undo.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Why didn&apos;t it find my own-card transfer?</Trans>}
                    answer={
                        <Trans>
                            The receiving card has to be closed on your account, and its masked card number has to match exactly one of your
                            closed cards within about half a day and the expected amount. If the card is still active, or the masked number
                            matches more than one closed card, the repair leaves it alone.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Why do duplicates appear at all?</Trans>}
                    answer={
                        <Trans>
                            Bank APIs can re-deliver a transaction after a retry or an overlapping resync window. The repair finds those
                            repeated imported rows and removes the copies, not the original event.
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
