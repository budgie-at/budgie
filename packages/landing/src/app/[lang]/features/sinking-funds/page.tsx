/* eslint-disable max-lines-per-function */
import { Trans } from '@lingui/react/macro';
import { Calendar, Sparkles, Tags, Target } from 'reicon-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureVersus } from '../../../../feature/component/feature-versus/feature-versus';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function SinkingFundsFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Yearly bills and trips, planned ahead</Trans>}
                tagline={
                    <Trans>
                        Set money aside every period for a bill that comes once a year, give a trip its own budget, and let Budgie suggest
                        small limit changes from your real history.
                    </Trans>
                }
            />

            <FeatureSpecTiles heading={<Trans>Three ways to plan past this month</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>reserved each period</Trans>} value={<Trans>Set aside</Trans>}>
                    <Trans>Budgie reserves what is still missing for a fund before its due date.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>budget with its own limit</Trans>} value={<Trans>Event</Trans>}>
                    <Trans>A tag and a date range, such as a trip, with optional category limits.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>largest limit change</Trans>} value={<Trans>10%</Trans>}>
                    <Trans>Auto-tune lists every change and can be switched off per budget.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureVersus
                heading={<Trans>Annual bills without the surprise</Trans>}
                lede={<Trans>A yearly bill does not fit a monthly budget. Spreading it out does.</Trans>}
            >
                <FeatureVersus.Without title={<Trans>Wait for the bill</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>One month takes the whole hit</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Safe to spend looks fine until it lands</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>A trip eats into the everyday budget</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Set money aside</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>A little is reserved every period</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>The fund pays the bill when it posts</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>A trip gets its own limit and dates</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Calendar} title={<Trans>Named targets with a due date</Trans>}>
                    <Trans>One-off or repeating, pre-filled from a yearly recurring charge</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Tags} title={<Trans>A budget for a trip</Trans>}>
                    <Trans>A tag plus a date range, with its own limit and optional category limits</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Target} title={<Trans>Still in the main budget</Trans>}>
                    <Trans>Tagged spending keeps counting in your main budget as well</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Sparkles} title={<Trans>Limits that tune themselves</Trans>}>
                    <Trans>Small, listed changes after three closed periods, never without a record</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Each period Budgie reserves what is still missing for every fund</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>The fund pays the real expense when it posts near the due date</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Every limit change is listed under Limit changes</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Auto-tune can be switched off for each budget</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item title={<Trans>Set aside for bills that come once a year</Trans>}>
                    <p>
                        <Trans>
                            Set aside holds named targets with a due date. A target can be one-off or repeating, and Budgie can pre-fill one
                            from a yearly recurring charge it has already found in your history.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Each period Budgie reserves what is still missing, spread over the periods left before the due date. When the
                            real expense posts near the due date, the fund pays it instead of the budget.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item title={<Trans>A separate budget for a trip or an event</Trans>}>
                    <p>
                        <Trans>
                            An event budget pairs a tag with a date range, such as a holiday. It has its own limit and optional category
                            limits, and it covers the days from the first to the last date.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Tagged spending still counts in your main budget too, so nothing disappears from your monthly picture.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item title={<Trans>Auto-tune, with a record of every change</Trans>}>
                    <p>
                        <Trans>
                            After three closed periods that were all at or under 80% of a category limit, or all over it, Budgie moves that
                            limit by at most 10%.
                        </Trans>
                    </p>
                    <p>
                        <Trans>Every change is listed under Limit changes. You can switch tuning off for any budget.</Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    question={<Trans>What is a sinking fund?</Trans>}
                    answer={
                        <Trans>
                            A named target with a due date for a bill that comes once a year. Budgie can suggest one from a yearly recurring
                            charge, reserves what is still missing each period, and lets the fund pay the real expense when it posts near
                            the due date.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Can a fund repeat?</Trans>}
                    answer={<Trans>Yes. A fund can be one-off or repeating, so a yearly bill keeps being planned for.</Trans>}
                />
                <FeatureFaq.Item
                    question={<Trans>Can I budget a trip separately?</Trans>}
                    answer={
                        <Trans>
                            Yes. An event budget pairs a tag with a date range and has its own limit and optional category limits. The
                            tagged spending still counts in your main budget.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Does Budgie change my limits on its own?</Trans>}
                    answer={
                        <Trans>
                            Only through auto-tune, by at most 10% after three closed periods that were all at or under 80% or all over the
                            limit. Each change is listed under Limit changes, and you can switch tuning off per budget.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Does this need an account or a subscription?</Trans>}
                    answer={
                        <Trans>
                            No. Funds, event budgets and tuning are worked out on your device, with no account and no subscription.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
