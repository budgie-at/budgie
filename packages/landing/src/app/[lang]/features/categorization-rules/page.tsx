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

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>From a rule you wrote to what is left for the AI</Trans>}>
                    <Trans>
                        Three screens: the Rules list, the Quick rule pill on a transaction you just recategorized, and everything no rule
                        matched.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Some things should not be guessed</Trans>}>
                    <Trans>
                        The Rules screen shows what you decided, rule by rule: the conditions on top — Title contains &ldquo;Spotify&rdquo;
                        and Type equals EXPENSE — and under them the category and the tag the match sets. A condition can also read the
                        merchant code, the amount, the account or the import source, and every rule has its own switch, so turning one off
                        never means deleting it.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Rules screen: four rules, each with its conditions above the category and tag it sets, and an on-off switch`}
                    index={0}
                    locale={lang}
                    priority
                    scene="categorization-rules-1"
                    slug="categorization-rules"
                >
                    <FeatureStory.Callout y={0.252}>
                        <Trans>Conditions you wrote yourself</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.496}>
                        <Trans>The category it sets</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>The Quick rule pill writes it for you</Trans>}>
                    <Trans>
                        Change the category or the tags of an existing transaction and a Quick rule pill appears above the amount. It builds
                        the conditions from the merchant name — reference numbers, amounts, dates and company suffixes stripped out, the
                        comment used when the name is too generic — pins the merchant code when the transaction carries one, and attaches
                        exactly the category and tags you just picked. Tap the pill and the rule exists; swipe it away and it is gone.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie edit expense screen with a Quick rule pill above the amount, moments after the category was changed`}
                    index={1}
                    locale={lang}
                    scene="categorization-rules-2"
                    slug="categorization-rules"
                >
                    <FeatureStory.Callout y={0.26}>
                        <Trans>Tap it, the rule exists</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.416}>
                        <Trans>Conditions built from this name</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Rules run before the AI does</Trans>}>
                    <Trans>
                        Rules are evaluated on Monobank sync, on bank file sync and on file import, so most rows land already categorized —
                        and a category a rule assigned is never second-guessed by a suggestion. What no rule covered is counted in the
                        missing-categories pill above the list; open one of those rows and the on-device suggestion offers a category for
                        it.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie transaction list with a 14 missing categories pill above rows that carry no category chip`}
                    index={2}
                    locale={lang}
                    scene="uncategorized-transactions-1"
                    slug="uncategorized-transactions"
                >
                    <FeatureStory.Callout y={0.205}>
                        <Trans>What no rule covered</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.287}>
                        <Trans>Rows still without a category</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

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
                        When exactly one of your existing rules already matches the transaction, the pill turns into &ldquo;Update
                        rule?&rdquo; and rewrites that rule&apos;s category and tag instead of creating a near-duplicate. When the
                        conditions it would write already exist word for word, Budgie says so and lets you open the existing rule or create
                        the new one anyway. Either way the rule is applied to your existing transactions as soon as it is saved.
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
