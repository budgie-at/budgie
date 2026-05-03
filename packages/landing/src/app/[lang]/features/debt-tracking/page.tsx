/* eslint-disable max-lines-per-function */
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageCta } from '../../../../feature/component/feature-page-cta/feature-page-cta';
import { FeaturePageFaqItem } from '../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { buildFeaturePageJsonLd } from '../../../../feature/util/build-feature-page-json-ld.util';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
import { getFeatureBySlug } from '../../../../feature/util/get-feature-by-slug.util';
import { getRelatedFeatures } from '../../../../feature/util/get-related-features.util';
import { JsonLd } from '../../../../generic/component/json-ld/json-ld';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import type { Metadata } from 'next';

const SLUG = 'debt-tracking';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);
    const entry = getFeatureBySlug(SLUG);
    if (!isDefined(entry)) {
        return {};
    }

    return buildFeaturePageMetadata({
        locale: lang,
        slug: SLUG,
        title: i18n._(entry.metaTitle),
        description: i18n._(entry.metaDescription),
        keywords: entry.seoKeywords.join(', '),
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt
    });
}

export default async function DebtTrackingFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);
    const entry = getFeatureBySlug(SLUG);
    if (!isDefined(entry)) {
        return null;
    }

    const related = getRelatedFeatures(SLUG);
    const [breadcrumbSchema, webPageSchema, faqSchema] = buildFeaturePageJsonLd({
        locale: lang,
        slug: SLUG,
        title: i18n._(entry.metaTitle),
        description: i18n._(entry.metaDescription),
        featureName: i18n._(entry.title),
        featuresLabel: i18n._(msg`Features`),
        homeLabel: i18n._(msg`Home`),
        faqs: entry.faqs.map(faq => ({ question: i18n._(faq.question), answer: i18n._(faq.answer) })),
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt
    });

    return (
        <main className="flex-1">
            <JsonLd data={breadcrumbSchema} />
            <JsonLd data={webPageSchema} />
            {isDefined(faqSchema) && <JsonLd data={faqSchema} />}
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={i18n._(entry.title)} locale={lang} />}
                heading={<Trans>Debt & Loan Tracking</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        That €200 you lent your sister, the €1500 you owe a friend — first-class accounts with target balances, return
                        dates, and contact assignment.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why inter-personal debt deserves its own account type</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Inter-personal debt is invisible to most apps. Budgie has Debt as a real account type, with explicit &quot;I
                        owe&quot; / &quot;owes me&quot; direction, optional contact, target return date, and target balance.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Net worth respects debt direction: liabilities reduce, receivables increase. Settling the debt is just a transfer to
                        or from the debt account; balance hits zero, you can archive.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Explicit direction: &quot;I owe&quot; vs &quot;owes me&quot; — net worth signs them correctly</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Optional contact name — track inter-personal loans without spreadsheets</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Target balance and return date for closing the loop</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Settle by transfer to a real account — no awkward &quot;expense&quot; workarounds</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Archive when settled — debt drops off the home screen but stays in history</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Account type Debt with sub-type &quot;I owe&quot; or &quot;owes me&quot;. Linked to a contact name (optional).
                        Settlement happens as transfers between the debt account and a real cash/bank account.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection>
                <FeaturePageFaqItem
                    question={<Trans>What&apos;s the difference between &quot;I owe&quot; and &quot;owes me&quot;?</Trans>}
                    answer={
                        <Trans>
                            Direction. &quot;I owe&quot; is a liability — your net worth subtracts it. &quot;Owes me&quot; is a receivable —
                            your net worth adds it. Same account type, opposite sign.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I link a debt to a contact?</Trans>}
                    answer={
                        <Trans>
                            Yes — each debt account has an optional contact name. Useful for tracking inter-personal loans without
                            spreadsheets.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How do I settle a debt?</Trans>}
                    answer={
                        <Trans>
                            Make a transfer between the debt account and a real cash/bank account. The debt balance hits zero; archive the
                            account if you want it off the home screen.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does the target return date trigger a reminder?</Trans>}
                    answer={
                        <Trans>
                            Currently it&apos;s informational — surfaced in the account detail and recurring view. Push reminders are on the
                            roadmap.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>

            <FeaturePageRelated features={related} locale={lang} />
            <FeaturePageRelatedArticles locale={lang} slugs={entry.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
