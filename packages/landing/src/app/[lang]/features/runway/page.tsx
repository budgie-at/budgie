/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureCropBand } from '../../../../feature/component/feature-crop-band/feature-crop-band';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function RunwayFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie Runway tab with a burning verdict, a run-out month, a meter and the monthly expenses, income and net`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>How long your money lasts</Trans>}
                tagline={
                    <Trans>
                        Budgie compares what you earn and spend in a typical month with the money in your cash and bank accounts. If you
                        spend more than you earn, it shows how many months are left and when the money runs out. If you earn more, it shows
                        how much you add each month.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="runway-1" slug="runway" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>One question, answered on Home</Trans>}>
                    <Trans>From the pill under your balance to the costs behind the number.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Months left, and the month it ends</Trans>}>
                    <Trans>
                        When you spend more than you earn, Runway divides your balance by the gap and names the month it runs out.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="runway-1" slug="runway">
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

                <FeatureStory.Step index={1} title={<Trans>Growing is a verdict too</Trans>}>
                    <Trans>
                        Earn more than you spend and Runway shows what you add each month and how many months of spending you have.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Runway tab with a growing verdict showing the amount added per month and the months of expenses covered`}
                    index={1}
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

                <FeatureStory.Step index={2} title={<Trans>What drives the number</Trans>}>
                    <Trans>Monthly history flags one-off months, and your biggest categories or tags are listed by monthly cost.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie Runway monthly history with a one-off month highlighted above the spending drivers by category`}
                    index={2}
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

                <FeatureStory.Step index={3} title={<Trans>Your call in Settings</Trans>}>
                    <Trans>Hide the pill from Home, or let Runway count your crypto at today&apos;s market value.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie settings with the Runway section showing the show on home and include crypto switches`}
                    index={3}
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

            <FeatureSpecTiles heading={<Trans>The numbers behind the verdict</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>complete months of history</Trans>} value="6">
                    <Trans>Runway reads your last six finished months, never the one in progress.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>complete months before it appears</Trans>} value="3">
                    <Trans>Until then the pill stays hidden and the tab tells you how many it has.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>months on the meter scale</Trans>} value="12">
                    <Trans>While you are burning, the meter counts months left across one year.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureCropBand
                heading={<Trans>The whole answer on one screen</Trans>}
                lede={<Trans>Verdict, run-out month and a typical month, together.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(
                            i18n
                        )`Budgie Runway tab with a burning verdict, the Include one-offs switch and the monthly expenses, income and net`}
                        locale={lang}
                        scene="runway-1"
                        slug="runway"
                        y={0.2}
                    >
                        <FeatureCropBand.Pin x={0.6} y={0.235} />
                        <FeatureCropBand.Pin x={0.55} y={0.372} />
                        <FeatureCropBand.Pin x={0.38} y={0.478} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>Months left at this pace</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Switch on for the cautious view</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>A typical month: spending, income, net</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Built on a typical month, not a lucky one</Trans>}>
                    <p>
                        <Trans>
                            Runway looks at your last six complete calendar months and leaves out the month still in progress. It takes the
                            middle value of your monthly spending and of your monthly income, so one expensive holiday or one unusually
                            large payment does not swing the answer.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            While you are burning, a meter counts the months left on a one-year scale. While you are growing there is
                            nothing to count down, so the meter steps aside.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            The balance it spends down is money you can actually use: your cash and bank accounts, including synced ones.
                            Savings, deposits and investments stay out, and so does crypto unless you switch it on.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Want the cautious view? Switch on Include one-offs and the monthly average of irregular costs, like insurance or
                            holidays, is added to your spending. The verdict and the balance forecast update straight away.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>What does &ldquo;months left&rdquo; mean?</Trans>}
                    answer={
                        <Trans>
                            It is your cash and bank balance divided by how much more you spend than you earn in a typical month. If nothing
                            changes, that is how long the money lasts, and Runway shows the month it would run out.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Why does Runway need three complete months?</Trans>}
                    answer={
                        <Trans>
                            A single month says little about your habits. Runway only counts finished calendar months, up to the last six,
                            and appears once at least three of them have transactions. Until then the pill stays hidden and the Runway tab
                            tells you how many complete months it has so far.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>What does Include one-offs do?</Trans>}
                    answer={
                        <Trans>
                            It adds the monthly average of costs that come in bursts, such as an annual insurance payment or a holiday, on
                            top of your typical month. The months left, the run-out month and the forecast then show the more cautious
                            picture. Switch it off to go back.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Does Runway count my crypto and savings?</Trans>}
                    answer={
                        <Trans>
                            Savings, deposits and investments are never counted, because they are not money you spend from day to day.
                            Crypto is left out by default. Turn on Include crypto in Settings and Runway counts it at today&apos;s market
                            value, with a note on the verdict so you know it is included.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={4}
                    question={<Trans>What if I earn more than I spend?</Trans>}
                    answer={
                        <Trans>
                            Then Runway says Growing and shows how much you add in a typical month, plus how many months of expenses your
                            balance already covers. There is no run-out month, because at that pace the money does not run out.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
