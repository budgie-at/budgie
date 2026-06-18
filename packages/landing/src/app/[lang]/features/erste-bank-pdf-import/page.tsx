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

export default async function ErsteBankPdfImportFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Erste Bank PDF Import</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Import your full Erste Bank account statement straight from the PDF — including the new modern layout introduced in
                        2026.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why a dedicated parser beats a generic CSV converter</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Erste Bank does not expose a public API for personal accounts. PDF statements are the only export. Budgie ships a
                        parser tuned to the exact Erste statement layout — both the classic and the new 2026 modern format.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The parser extracts account holder, IBAN, opening/closing balances, and every transaction line including value date,
                        booking date, and reference text. MCC is inferred from booking-text patterns where present.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Both Erste statement layouts supported: classic and the 2026 modern format</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Account holder, IBAN, opening and closing balances all extracted automatically</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Booking date and value date both captured per transaction</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>MCC inferred from booking-text patterns where present</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Preview every parsed transaction before write — no surprises</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Tap Import → Erste PDF. Pick the file from Files. Budgie parses the document, shows a preview, and inserts every
                        transaction into a new or existing Erste account.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Which Erste statement formats are supported?</Trans>}
                    answer={
                        <Trans>
                            Both the classic layout and the modern format introduced in 2026 are parsed natively. If Erste rolls out another
                            redesign, the parser updates with the next release.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Will the parser get my IBAN right?</Trans>}
                    answer={
                        <Trans>
                            Yes — IBAN extraction is part of the header parse. The IBAN is stored on the account and enables automatic
                            transfer-pair detection between Erste and other accounts you own.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I re-import the same PDF safely?</Trans>}
                    answer={
                        <Trans>
                            Yes. Transactions deduplicate by their booking reference, so re-importing skips known rows and inserts only new
                            ones.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does the parser run online?</Trans>}
                    answer={<Trans>No. PDF parsing happens entirely on-device — your statement never leaves your phone.</Trans>}
                />
            </FeaturePageFaqSection>

            <FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
