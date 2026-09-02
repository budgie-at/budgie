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

export default async function BankIntegrationManagementFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Bank Connections — One Credential, Many Accounts</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Your card, your jars, and the deposit you opened last month all hang off one connection — so renewing a token is a
                        single edit, not a rebuild.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why the credential deserves its own object</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        A bank token is not a property of one account — it is a property of your relationship with the bank. Budgie models
                        it that way: a connection holds the provider and the credential, and every account you sync from that bank points at
                        it.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The payoff shows up the day your token expires. Enter the new one once and every account on that connection is back
                        online together, with their error counters cleared. If the token you paste already belongs to another connection,
                        the account is moved onto it instead of quietly creating a duplicate.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>One connection behind many accounts — cards, jars, and deposits from the same bank</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Change the token once and every account on that connection follows</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>A connection screen listing its accounts with their balances and a per-account sync switch</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Add more accounts from the bank later without re-entering credentials, with duplicates filtered out</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Open a deposit straight from the connection, so it inherits the bank it belongs to</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>Statement-based banks get a connection too, so imported accounts group under one roof</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={6}>
                        <Trans>Archiving or deleting one account leaves the rest of the connection syncing untouched</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>One screen per bank</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Each bank section on the home screen has a shortcut into its connection. Inside you get the accounts that belong to
                        it, each with its icon, title, and current balance, and a switch to pause syncing for that account alone while its
                        siblings keep going.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        What the screen offers next depends on the bank. Connections that talk to a live API can pull the bank&apos;s
                        account list and add whatever you left out the first time. Statement-based banks offer an import action instead.
                        Both can open a new deposit account that starts out attached to the same bank.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Connect a bank once and the credential is stored as a connection for that provider. Any account you create from it —
                        during setup or months later — records which connection it came from, and sync resolves the token through that link
                        rather than keeping a copy per account.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Do I have to re-add every account when my token expires?</Trans>}
                    answer={
                        <Trans>
                            No. The token lives on the connection, so updating it from any account&apos;s sync settings restores every
                            account sharing that connection at once.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can jars and deposits sit on the same connection as my card?</Trans>}
                    answer={
                        <Trans>
                            Yes — cards, jars, and deposit accounts from the same bank all attach to one connection and appear together on
                            its screen.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What happens if I close one of the accounts?</Trans>}
                    answer={
                        <Trans>
                            Only that account is affected. Archiving or deleting it never removes the connection, so its siblings keep
                            syncing with the same credential.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does this work for banks I import statements from?</Trans>}
                    answer={
                        <Trans>
                            Yes. File-based banks get their own connection as well, which is where the import action lives and what keeps
                            their accounts grouped together.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I open a deposit from any connection?</Trans>}
                    answer={
                        <Trans>
                            From bank connections, yes. Crypto exchange connections do not offer deposit accounts, since the concept does
                            not map onto them.
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
