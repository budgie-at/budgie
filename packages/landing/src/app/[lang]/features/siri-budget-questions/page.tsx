/* eslint-disable max-lines-per-function */
import { Trans } from '@lingui/react/macro';
import { Calendar, ChartPie, EyeOff, Lock, Wallet } from 'reicon-react';

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

export default async function SiriBudgetQuestionsFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Ask Siri about your money</Trans>}
                tagline={
                    <Trans>
                        Ask how much you spent, what is left in your budget or what is due this week. Siri answers out loud without opening
                        Budgie, and never changes your data.
                    </Trans>
                }
            />

            <FeatureSpecTiles heading={<Trans>Quick answers, nothing exposed</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>what Siri can do with your data</Trans>} value={<Trans>Read-only</Trans>}>
                    <Trans>Siri only reads. It cannot add, edit or delete anything.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>look-ahead for upcoming charges</Trans>} value={<Trans>7 days</Trans>}>
                    <Trans>Hear which recurring charges are due, with dates and a total.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>amounts spoken while the PIN lock is on</Trans>} value={<Trans>None</Trans>}>
                    <Trans>Siri asks you to unlock Budgie instead of reading out your numbers.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureVersus
                heading={<Trans>Open the app or just ask</Trans>}
                lede={<Trans>A quick money question should not need a tap and a scroll.</Trans>}
            >
                <FeatureVersus.Without title={<Trans>Open the app</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Find the app, wait for it to load</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Dig through screens for one number</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Hard to do with your hands full</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Ask Siri</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Say the question out loud</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Hear the answer straight away</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Your PIN lock still keeps amounts private</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={ChartPie} title={<Trans>Spending by category</Trans>}>
                    <Trans>Ask about any category for this month or last month</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Wallet} title={<Trans>Balances and net worth</Trans>}>
                    <Trans>Ask for one account&apos;s balance or for your total net worth</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Calendar} title={<Trans>Charges due soon</Trans>}>
                    <Trans>Hear the recurring charges due in the next 7 days and what they add up to</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Lock} title={<Trans>Private by default</Trans>}>
                    <Trans>Answers are prepared on your iPhone and hidden while your PIN lock is on</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={EyeOff} title={<Trans>No amounts when locked</Trans>}>
                    <Trans>With the PIN lock on, Siri says to unlock Budgie instead of reading your numbers</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Ask how you are doing against your budget and hear what is left, or how far over you are</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Answers are spoken in the language you chose in Budgie, with your currency and cents setting</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Siri never opens the app and never changes your data</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item title={<Trans>What you can ask</Trans>}>
                    <p>
                        <Trans>
                            Say one of these to Siri. Say &ldquo;How much did I spend on groceries in Budgie&rdquo;, or &ldquo;How much did
                            I spend in Budgie&rdquo; and then name the category. Say &ldquo;Budgie spending on&rdquo; followed by a category
                            for the same answer.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Say &ldquo;How is my Budgie budget&rdquo; or &ldquo;Budgie budget status&rdquo; for your budget. Name an account
                            for its balance: &ldquo;What&apos;s my savings balance in Budgie&rdquo;. Say &ldquo;What&apos;s my net worth in
                            Budgie&rdquo; or &ldquo;What&apos;s my balance in Budgie&rdquo; for your total.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Say &ldquo;What bills are due in Budgie&rdquo; or &ldquo;Upcoming charges in Budgie&rdquo; to hear the next
                            seven days. The spoken phrases are in English. The answers come back in your Budgie language.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item title={<Trans>What stays private</Trans>}>
                    <p>
                        <Trans>
                            Budgie prepares the answers on your iPhone and hands them to Siri there. When the PIN lock is on, the amounts
                            are cleared and Siri says &ldquo;Unlock Budgie to see this&rdquo;. If the answers are out of date, such as a new
                            month, Siri asks you to open Budgie to refresh.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    question={<Trans>What can I ask Siri?</Trans>}
                    answer={
                        <Trans>
                            Category spending for this month or last month, your budget status, an account balance, your net worth and the
                            recurring charges due in the next 7 days.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Can Siri add or change anything?</Trans>}
                    answer={<Trans>No. These questions are read-only. Siri cannot add a transaction, edit one or change a setting.</Trans>}
                />
                <FeatureFaq.Item
                    question={<Trans>What happens when my PIN lock is on?</Trans>}
                    answer={
                        <Trans>
                            Budgie clears the amounts and Siri tells you to unlock Budgie to see them. Nothing is read out until the lock is
                            off.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Where are the answers calculated?</Trans>}
                    answer={
                        <Trans>
                            On your iPhone. Budgie prepares them from your own data and gives them to Siri, so nothing about your finances
                            is sent to a Budgie server.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Why does Siri sometimes ask me to open Budgie?</Trans>}
                    answer={
                        <Trans>
                            Answers are prepared when Budgie runs. If the month has changed, or the upcoming charges are from an earlier
                            day, Siri asks you to open Budgie to refresh them.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Does every account have a balance answer?</Trans>}
                    answer={
                        <Trans>
                            Debt accounts and crypto accounts have no spoken balance. Siri tells you it is not available yet. Your net worth
                            answer still covers your whole picture.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
