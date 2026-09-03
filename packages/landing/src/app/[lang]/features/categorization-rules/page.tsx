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
import { FeaturePageMedia } from '../../../../feature/component/feature-page-media/feature-page-media';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { FeaturePageWebPageJsonLd } from '../../../../feature/component/feature-page-web-page-json-ld/feature-page-web-page-json-ld';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
import { AppShot } from '../../../../generic/component/app-shot/app-shot';
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

export default async function CategorizationRulesFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Categorization Rules — Deterministic, Not Guesswork</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Write the rule once and every future import obeys it: match on what the transaction actually says, then set the
                        category, add a tag, or turn it into a transfer.
                    </Trans>
                }
            />

            <FeaturePageMedia>
                <AppShot
                    alt={t(i18n)`Budgie categorization rules screen listing the merchant rules that assign categories automatically`}
                    locale={lang}
                    scene="categorization-rules-1"
                    slug="categorization-rules"
                />
            </FeaturePageMedia>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Some categorization should be a rule, not a suggestion</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Your landlord&apos;s transfer, your gym membership, the corner shop you visit twice a week — you already know where
                        those belong. A rule states that once, in plain conditions, and the app stops asking.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Conditions can look at the title, the comment, the amount, the merchant category code, the account, the transaction
                        type, or the import source it came from. Combine them with &quot;match all&quot; or &quot;match any&quot;, and pick
                        the operator that fits: equals, contains, does not contain, greater than, less than, between, in a list, or a
                        regular expression. Text comparisons ignore letter case.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Conditions on title, comment, amount, MCC, account, transaction type, and import source</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Match all or match any, with contains, equals, comparison, list, and regular-expression operators</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Actions that set a category, add a tag, or convert the transaction into a transfer</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Rules run automatically on Monobank sync, bank file sync, and CSV import</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Saving a rule applies it retroactively to matching transactions you already have</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>A dedicated Rules screen with search across conditions, actions, categories, tags, and accounts</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={6}>
                        <Trans>Every rule can be switched off without being deleted</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={7}>
                        <Trans>A &quot;matching rules&quot; pill on a transaction shows which rules apply to it</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>The Quick rule pill writes the rule for you</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Right after you change the category or tags of an existing transaction, a Quick rule pill slides into the edit
                        screen with a ready-made rule. It builds the conditions from the merchant name — stripping reference numbers,
                        amounts, dates, and company suffixes, falling back to the comment, and refusing to build anything from generic
                        titles like a bare card purchase — and it pins the merchant category code when the transaction has one.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        If one of your existing rules already covers that merchant, the pill offers to extend that rule instead of creating
                        a near-duplicate, and warns you when the edit you just made contradicts a rule you already have. Accept it, swipe it
                        away, or open it and adjust every condition first.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Rules and on-device AI do different jobs</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Rules are deterministic: the same conditions produce the same category every single time, which is what you want for
                        rent, salary, subscriptions, and anything with a stable merchant name. On-device AI categorization is the opposite
                        tool — it guesses sensibly for merchants you have never seen before. They are separate systems, and most setups end
                        up using both.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Open Settings, then Rules. Add conditions, choose match all or match any, attach one or more actions, and save.
                        Incoming bank and import transactions are evaluated before they are written, and existing transactions are updated
                        in the background in batches so the app stays responsive.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Do rules apply to transactions I type in myself?</Trans>}
                    answer={
                        <Trans>
                            Automatic evaluation runs on Monobank sync, bank file sync, and CSV import. For everything else, saving or
                            editing a rule re-applies it across your existing transactions, which covers manual entries too.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can one rule do more than one thing?</Trans>}
                    answer={
                        <Trans>
                            Yes. A rule holds several actions, so the same match can set the category and add a tag, or convert the
                            transaction into a transfer to a chosen account.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What happens when I already have a lot of rules?</Trans>}
                    answer={
                        <Trans>
                            The Rules screen has a ranked search that looks at every condition, every action, and the related category, tag,
                            and account names, so you can find the rule responsible for a category in a couple of keystrokes.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is this the same as the AI categorization?</Trans>}
                    answer={
                        <Trans>
                            No. Rules are explicit conditions you wrote and can read back. AI categorization is a separate on-device
                            suggestion engine for merchants no rule covers yet.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I turn a rule off temporarily?</Trans>}
                    answer={
                        <Trans>
                            Yes — each rule has its own switch in the Rules list, and swiping a row deletes it when you no longer need it at
                            all.
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
