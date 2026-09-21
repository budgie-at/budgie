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

export default async function PrivatbankImportFeaturePage(props: PageLangParam) {
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
                heading={<Trans>PrivatBank XLSX Import</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Import accounts and transactions from a PrivatBank24 XLSX export — with PrivatBank&apos;s own MCC categories mapped
                        automatically.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why MCC mapping matters for downstream automation</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        This is a one-time import from a Privat24 statement export, not a live sync — each export covers a single card or
                        account, so a multi-card wallet needs one import per card.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        PrivatBank exports XLSX with a fixed schema and proprietary MCC labels. Budgie parses both, mapping each PrivatBank
                        category to the equivalent ISO MCC code so AI categorization downstream still works.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Long-press a PrivatBank account card on the home screen to jump straight to the file picker for that account — pick
                        a fresh export and Budgie merges it in, skipping anything already imported.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Native PrivatBank24 XLSX schema parser — no manual column mapping</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>PrivatBank&apos;s proprietary MCC labels map to ISO MCC codes automatically</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>
                            Long-press a PrivatBank account card on the home screen to jump straight to the file picker for a fresh import
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Currency, FX, and counterparty fields all preserved</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Dedupes against existing transactions on re-import</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>One-time import per card or account — not a live sync, so re-run it whenever you want fresh data</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        In the Privat24 app, select the card or account you want to import, open its statement, and choose a date range
                        covering your full history. Export it as Excel — PDF and CSV aren&apos;t accepted — and if Privat24 emails the file
                        instead of downloading it, save the attachment from your inbox. In Budgie, start a new account, choose PrivatBank,
                        and pick the saved file. Budgie validates it, parses the rows, and writes them to your selected account.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>How do I export from Privat24?</Trans>}
                    answer={
                        <Trans>
                            Open Privat24, select the card or account you want to import, and open its statement. Choose a date range that
                            covers your full history, then export it as Excel — PDF and CSV files can&apos;t be imported. If Privat24 emails
                            you the file instead of downloading it, save the attachment from your inbox, then pick it from Budgie&apos;s
                            file picker.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What about PrivatBank&apos;s custom MCC labels?</Trans>}
                    answer={
                        <Trans>
                            Budgie maps each PrivatBank category label to the corresponding ISO MCC code, so AI categorization, MCC chips,
                            and analytics all work the same as with other bank-synced data.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is the long-press shortcut destructive?</Trans>}
                    answer={
                        <Trans>
                            No — long-press just opens the file picker for that account. Re-importing the same export again is safe;
                            anything already there is skipped.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is this a live sync?</Trans>}
                    answer={
                        <Trans>
                            No. This is a one-time import from a Privat24 statement export, and each export only covers a single card or
                            account. Re-run the import whenever you want fresh data.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does it work offline?</Trans>}
                    answer={
                        <Trans>
                            The parsing step is on-device. You only need internet to download the XLSX from PrivatBank24 in the first place.
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
