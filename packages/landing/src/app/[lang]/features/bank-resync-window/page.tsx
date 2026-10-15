/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { CalendarClock, CopyX, Tags } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
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

export default async function BankResyncWindowFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie Account Settings for a bank-synced account with the re-sync sheet open on four options: re-sync entire history, last 90 days, last 30 days and last 7 days`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Re-pull a slice, keep your edits</Trans>}
                tagline={
                    <Trans>
                        Re-pull the last 7, 30 or 90 days from your bank instead of resetting the account and re-walking its whole history.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="bank-resync-window-1" slug="bank-resync-window" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Rewind a week, not a year</Trans>}>
                    <Trans>
                        One sheet on the account&apos;s own settings screen: the whole history, or the last ninety, thirty or seven days.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Re-pull a slice, not everything</Trans>}>
                    <Trans>
                        Open a bank-synced account and tap Re-sync. Picking a window moves that account&apos;s sync start back to the date
                        you chose, so the next sync starts from there instead of walking the whole history again.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="bank-resync-window-1" slug="bank-resync-window">
                    <FeatureStory.Callout index={0} y={0.64}>
                        <Trans>The whole-history reset</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={0} y={0.715}>
                        <Trans>Or the last ninety days</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.863}>
                        <Trans>Seven days, one tap</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Down to the last week</Trans>}>
                    <Trans>
                        Seven days is the tightest slice on offer. Whatever comes back is matched against what you already have and updated
                        in place, so rows are refreshed rather than duplicated. The title and date are refreshed; your own comment, category
                        and tags stay, and the amount and type change only if the bank changed them.
                    </Trans>
                </FeatureStory.Step>
            </FeatureStory>

            <FeatureSpecTiles heading={<Trans>The re-sync sheet in numbers</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>windows to choose from</Trans>} value="4">
                    <Trans>The whole history, or the last 90, 30 or 7 days.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>days is the smallest slice</Trans>} value="7">
                    <Trans>The tightest window re-pulls just the last week.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>option asks before it resets anything</Trans>} value={<Trans>One</Trans>}>
                    <Trans>Only the whole-history reset asks you to confirm.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureCropBand
                heading={<Trans>Pick how far to rewind</Trans>}
                lede={<Trans>One sheet on each synced account&apos;s settings.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(i18n)`Budgie re-sync sheet listing re-sync entire history, last 90 days, last 30 days and last 7 days`}
                        locale={lang}
                        scene="bank-resync-window-1"
                        slug="bank-resync-window"
                        y={0.6}
                    >
                        <FeatureCropBand.Pin x={0.72} y={0.625} />
                        <FeatureCropBand.Pin x={0.55} y={0.705} />
                        <FeatureCropBand.Pin x={0.5} y={0.853} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>Whole history, resets the account&apos;s sync</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Or just the last 90 days</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Or only the last 7 days</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={CalendarClock} title={<Trans>Four re-sync windows</Trans>}>
                    <Trans>Four choices: the last 7, 30 or 90 days, or the whole history</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Tags} title={<Trans>Categories and tags stay</Trans>}>
                    <Trans>Your category, tags and own comment are kept; the amount and type change only when the bank changed them</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={CopyX} title={<Trans>No duplicate rows</Trans>}>
                    <Trans>Repeat rows are matched with what you already have, not inserted again</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>The whole-history option asks for confirmation before it resets the account&apos;s sync</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Transfers merged automatically inside the window are un-merged, so they can be matched again</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Re-sync sits in each account&apos;s own settings, beside its sync switch</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why a full re-sync is the wrong fix</Trans>}>
                    <p>
                        <Trans>
                            Sometimes a sync drifts — a transaction reconciles late, a refund posts after the fact. The blunt fix is to
                            reset the account and re-walk its entire history. Budgie&apos;s window picker rewinds only as far as you ask.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Pick the last 7, 30 or 90 days and Budgie moves that account&apos;s sync start back to the matching date; the
                            next sync re-fetches from there. Rows the bank sends again are matched with what you already have, so they are
                            updated in place instead of landing twice. Transfers Budgie had merged automatically inside the window are
                            un-merged, so they can be matched again.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Why not just full re-sync?</Trans>}
                    answer={
                        <Trans>
                            The whole-history option resets the account&apos;s entire sync and re-walks it from the beginning, and it
                            un-merges every transfer Budgie had matched automatically on that account. A window rewinds a set number of
                            days, un-merges only the automatic transfers inside it, and leaves everything older untouched.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>What&apos;s the smallest window?</Trans>}
                    answer={
                        <Trans>
                            Seven days. Thirty and ninety are the other two presets. There is no custom date range — the sheet offers
                            exactly these four choices.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>What happens to edited transactions in the window?</Trans>}
                    answer={
                        <Trans>
                            There is no conflict prompt. The title and date are refreshed from the bank. Your own comment, your category and
                            your tags are kept. The amount and type change only if the bank itself changed them, and not on rows already
                            merged into a transfer or refund.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Can I re-sync transactions from before bank-sync was enabled?</Trans>}
                    answer={
                        <Trans>
                            Only as far back as the bank&apos;s API serves. Re-sync works for Monobank and Binance connections; PrivatBank
                            and Erste arrive as file imports, where the range is whatever you export. CSV import is the universal fallback.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
