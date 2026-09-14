/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBreadcrumbsJsonLd } from '../../../../feature/component/feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
import { FeaturePageCategoryComparison } from '../../../../feature/component/feature-page-category-comparison/feature-page-category-comparison';
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

export default async function PrivateBudgetAppAlternativePage(props: PageLangParam) {
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
                heading={<Trans>Private Budget App — A Cloud-Free Alternative</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Cloud-based personal finance apps mirror every transaction to their servers. Budgie keeps your ledger on your
                        device. No account, no aggregator, no copy on somebody else&apos;s server.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Where a cloud-free budget app keeps your money data</Trans>}>
                    <Trans>
                        Budgie&apos;s Settings screen opens on a Privacy card, and the Security group sits right under it. Between them they
                        show the whole arrangement: one local database, no sign-in, and a lock you turn on yourself.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Point index={0}>
                    <Trans>
                        Privacy is the first group in Settings. Every account, transaction and category lives in a single SQLite file on the
                        phone — there is no vendor database holding a second copy.
                    </Trans>
                </FeatureStory.Point>

                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Settings screen with a Privacy card stating all financial data is stored locally on the device, above a Security group where App Lock is not yet enabled and Screenshot Protection is off`}
                    index={0}
                    locale={lang}
                    priority
                    scene="private-budget-app-alternative-1"
                    slug="private-budget-app-alternative"
                >
                    <FeatureStory.Callout index={0} y={0.255}>
                        <Trans>Stored locally on your device</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.4}>
                        <Trans>App Lock, off by default</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Point index={1}>
                    <Trans>
                        Nothing on this screen asks who you are. There is no account, no email, no sign-in step — so there is no server-side
                        profile that a breach could expose.
                    </Trans>
                </FeatureStory.Point>
                <FeatureStory.Point index={2}>
                    <Trans>
                        App Lock is opt-in, and the PIN you set does double duty: it becomes the SQLCipher key for the whole database. Until
                        you set one, the file is ordinary local SQLite — private to the app sandbox, but not encrypted.
                    </Trans>
                </FeatureStory.Point>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why this matters</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Cloud-based personal finance apps mirror every transaction to their servers. Budgie keeps your ledger on your
                        device. No account, no aggregator, no copy on somebody else&apos;s server.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Budgie vs. the category</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>
                            Cloud-based PFM apps mirror your transactions to their servers, share data with aggregators, and store your bank
                            credentials. Budgie does none of this — your ledger stays in a local database on your device, and setting a PIN
                            encrypts that database with SQLCipher.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>
                            Budgie talks to Monobank&apos;s own API with a token you paste in, parses Erste PDF statements and PrivatBank
                            Excel exports on the device, and imports any other bank through generic CSV. No aggregator sits in between.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>
                            Export Database writes the whole database to one file and hands it to the system share sheet, so you choose
                            where it goes — iCloud Drive, Google Drive, Dropbox, a NAS. Budgie has no sync server and no integration with
                            any of them.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Yes — Budgie&apos;s source is public. Read the network code yourself: github.com/budgie-at/budgie.</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Feature comparison</Trans>
                </FeaturePageHeading>
                <FeaturePageCategoryComparison categoryLabel={<Trans>Cloud-based PFM apps</Trans>}>
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Local SQLite, encrypted once you set a PIN</Trans>}
                        competitorValue={<Trans>Vendor&apos;s cloud + aggregator</Trans>}
                        label={<Trans>Where transactions live</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>No</Trans>}
                        competitorValue={<Trans>Yes — email + password</Trans>}
                        label={<Trans>Account required</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Optional, direct API tokens</Trans>}
                        competitorValue={<Trans>Required, via aggregator</Trans>}
                        label={<Trans>Bank login</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>None — there is no paid tier</Trans>}
                        competitorValue={<Trans>Monthly recurring</Trans>}
                        label={<Trans>Subscription</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>On your phone</Trans>}
                        competitorValue={<Trans>In the vendor cloud</Trans>}
                        label={<Trans>AI runs</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Yes</Trans>}
                        competitorValue={<Trans>No</Trans>}
                        label={<Trans>Public source</Trans>}
                    />
                </FeaturePageCategoryComparison>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>How is Budgie different from cloud-based PFM apps?</Trans>}
                    answer={
                        <Trans>
                            Cloud-based PFM apps mirror your transactions to their servers, share data with aggregators, and store your bank
                            credentials. Budgie does none of this — your ledger stays in a local database on your device, and setting a PIN
                            encrypts that database with SQLCipher.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How does bank sync work without an aggregator?</Trans>}
                    answer={
                        <Trans>
                            Budgie talks to Monobank&apos;s own API with a token you paste in, parses Erste PDF statements and PrivatBank
                            Excel exports on the device, and imports any other bank through generic CSV. No aggregator sits in between.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What about multi-device sync?</Trans>}
                    answer={
                        <Trans>
                            Export Database writes the whole database to one file and hands it to the system share sheet, so you choose
                            where it goes — iCloud Drive, Google Drive, Dropbox, a NAS. Budgie has no sync server and no integration with
                            any of them.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is the privacy claim verifiable?</Trans>}
                    answer={
                        <Trans>Yes — Budgie&apos;s source is public. Read the network code yourself: github.com/budgie-at/budgie.</Trans>
                    }
                />
            </FeaturePageFaqSection>

            <FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
