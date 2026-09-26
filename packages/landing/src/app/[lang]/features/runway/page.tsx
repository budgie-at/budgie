/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
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

export default async function RunwayFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Runway: How Long Your Money Lasts</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Budgie compares what you earn and spend in a typical month with the money in your cash and bank accounts. If you
                        spend more than you earn, it shows how many months are left and when the money runs out. If you earn more, it shows
                        how much you add each month.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>One question, answered on Home</Trans>}>
                    <Trans>From the pill under your balance to the costs behind the number.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Right under your balance</Trans>}>
                    <Trans>A small pill on Home shows the months left or what you add a month. Tap it for the full picture.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Clip
                    alt={t(i18n)`Screen recording of the runway pill under the Budgie home balance opening the Runway tab`}
                    index={0}
                    locale={lang}
                    scene="runway-clip-1"
                    slug="runway"
                />

                <FeatureStory.Step index={1} title={<Trans>Months left, and the month it ends</Trans>}>
                    <Trans>
                        When you spend more than you earn, Runway divides your balance by the gap and names the month it runs out.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Runway tab with a burning verdict, a run-out month, a meter and the monthly expenses, income and net`}
                    index={1}
                    locale={lang}
                    priority
                    scene="runway-1"
                    slug="runway"
                >
                    <FeatureStory.Callout y={0.234}>
                        <Trans>Months left at this pace</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.284}>
                        <Trans>Counts down a one-year scale</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.503}>
                        <Trans>A typical month in numbers</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Growing is a verdict too</Trans>}>
                    <Trans>
                        Earn more than you spend and Runway shows what you add each month and how many months of spending you have.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Runway tab with a growing verdict showing the amount added per month and the months of expenses covered`}
                    index={2}
                    locale={lang}
                    scene="runway-2"
                    slug="runway"
                >
                    <FeatureStory.Callout y={0.232}>
                        <Trans>Added in a typical month</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.473}>
                        <Trans>Income stays above spending</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={3} title={<Trans>What drives the number</Trans>}>
                    <Trans>Monthly history flags one-off months, and your biggest categories or tags are listed by monthly cost.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie Runway monthly history with a one-off month highlighted above the spending drivers by category`}
                    index={3}
                    locale={lang}
                    scene="runway-3"
                    slug="runway"
                >
                    <FeatureStory.Callout y={0.26}>
                        <Trans>One-off months stand out</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.41}>
                        <Trans>Biggest costs come first</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.76}>
                        <Trans>Small costs fold into Other</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={4} title={<Trans>Your call in Settings</Trans>}>
                    <Trans>Hide the pill from Home, or let Runway count your crypto at today&apos;s market value.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie settings with the Runway section showing the show on home and include crypto switches`}
                    index={4}
                    locale={lang}
                    scene="runway-4"
                    slug="runway"
                >
                    <FeatureStory.Callout y={0.59}>
                        <Trans>The pill can go</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.69}>
                        <Trans>Crypto is opt-in</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Built on a typical month, not a lucky one</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Runway looks at your last six complete calendar months and leaves out the month still in progress. It takes the
                        middle value of your monthly spending and of your monthly income, so one expensive holiday or one unusually large
                        payment does not swing the answer.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        While you are burning, a meter counts the months left on a one-year scale. While you are growing there is nothing to
                        count down, so the meter steps aside.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The balance it spends down is money you can actually use: your cash and bank accounts, including synced ones.
                        Savings, deposits and investments stay out, and so does crypto unless you switch it on.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Want the cautious view? Switch on Include one-offs and the monthly average of irregular costs, like insurance or
                        holidays, is added to your spending. The verdict and the balance forecast update straight away.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>What does &ldquo;months left&rdquo; mean?</Trans>}
                    answer={
                        <Trans>
                            It is your cash and bank balance divided by how much more you spend than you earn in a typical month. If nothing
                            changes, that is how long the money lasts, and Runway shows the month it would run out.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Why does Runway need three complete months?</Trans>}
                    answer={
                        <Trans>
                            A single month says little about your habits. Runway only counts finished calendar months, up to the last six,
                            and appears once at least three of them have transactions. Until then the pill stays hidden and the Runway tab
                            tells you how many complete months it has so far.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What does Include one-offs do?</Trans>}
                    answer={
                        <Trans>
                            It adds the monthly average of costs that come in bursts, such as an annual insurance payment or a holiday, on
                            top of your typical month. The months left, the run-out month and the forecast then show the more cautious
                            picture. Switch it off to go back.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does Runway count my crypto and savings?</Trans>}
                    answer={
                        <Trans>
                            Savings, deposits and investments are never counted, because they are not money you spend from day to day.
                            Crypto is left out by default. Turn on Include crypto in Settings and Runway counts it at today&apos;s market
                            value, with a note on the verdict so you know it is included.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if I earn more than I spend?</Trans>}
                    answer={
                        <Trans>
                            Then Runway says Growing and shows how much you add in a typical month, plus how many months of expenses your
                            balance already covers. There is no run-out month, because at that pace the money does not run out.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Do my analytics filters change the result?</Trans>}
                    answer={
                        <Trans>
                            No. Runway always uses all your transactions from the last complete months, whatever dates or filters you picked
                            on the other analytics tabs.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I hide the runway pill?</Trans>}
                    answer={
                        <Trans>
                            Yes. Turn off Show on home in the Runway section of Settings. The Runway tab stays available in Analytics.
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
