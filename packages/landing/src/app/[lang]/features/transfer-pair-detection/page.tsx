/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ArrowLeftRight, Link2, ShieldCheck } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureCropBand } from '../../../../feature/component/feature-crop-band/feature-crop-band';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { FeatureVersus } from '../../../../feature/component/feature-versus/feature-versus';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function TransferPairDetectionFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie transaction list where a matched transfer pair appears as one incoming transfer row naming the destination account`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Transfers and refunds, matched for you</Trans>}
                tagline={
                    <Trans>
                        Budgie consolidates obvious transfers and merchant refunds automatically, and leaves anything ambiguous exactly as
                        it imported it.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="transfer-pair-detection-1" slug="transfer-pair-detection" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Two rows, one movement</Trans>}>
                    <Trans>
                        Two screens: the list where a matched pair reads as a single transfer, and the sheet that still holds both originals
                        behind it.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Both accounts report the same move</Trans>}>
                    <Trans>
                        Sync the account the money left and the account it landed in, and each one imports its own leg — an expense on one
                        side, an income on the other. Left alone, one movement lands in your ledger twice.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={firstShotAlt}
                    index={0}
                    locale={lang}
                    scene="transfer-pair-detection-1"
                    slug="transfer-pair-detection"
                >
                    <FeatureStory.Callout index={0} y={0.667}>
                        <Trans>One transfer row, not two</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.732}>
                        <Trans>Named by its destination account</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>The obvious pairs merge on import</Trans>}>
                    <Trans>
                        An expense pairs with an income when the counter-IBAN lines up, or when the amounts match — same currency, or an
                        implied exchange rate inside a tolerance band — and both legs fall within twelve hours of each other. The match
                        becomes one transfer carrying a debit and a credit entry, so it stops counting as spending. Pairs Budgie is not sure
                        about are left alone as two rows rather than guessed at.
                    </Trans>
                </FeatureStory.Step>

                <FeatureStory.Step index={2} title={<Trans>See what merged, and undo it</Trans>}>
                    <Trans>
                        A merged transfer keeps a Consolidation row. &quot;View source transactions&quot; opens both originals with their
                        amounts, dates and accounts still intact. Revert puts them back and removes the merged transfer.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie merged transfer screen with the consolidation source sheet listing both original legs above Done and Revert`}
                    index={2}
                    locale={lang}
                    scene="transfer-pair-detection-2"
                    slug="transfer-pair-detection"
                >
                    <FeatureStory.Callout y={0.596}>
                        <Trans>Every merge keeps its sources</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.816}>
                        <Trans>The other leg, still there</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.878}>
                        <Trans>Revert restores both originals</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureVersus
                heading={<Trans>Why matching beats cleaning up</Trans>}
                lede={<Trans>Two synced banks report one move twice. Here is what changes when Budgie pairs them.</Trans>}
            >
                <FeatureVersus.Without title={<Trans>Fixing it by hand</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>One transfer shows up as two rows</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Your spending looks doubled</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Refunds look like new income</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>You hunt down each pair yourself</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Budgie with matching</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Matching legs merge into one transfer</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Spending stays accurate</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Clear refunds match their expense</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Obvious pairs merge, unsure ones stay put</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureCropBand
                heading={<Trans>Both originals, one tap away</Trans>}
                lede={<Trans>A merged transfer keeps the two legs it came from, and you can undo the merge.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(i18n)`Budgie consolidation sheet listing an outgoing and an incoming transfer above Done and Revert`}
                        locale={lang}
                        scene="transfer-pair-detection-2"
                        slug="transfer-pair-detection"
                        y={0.66}
                    >
                        <FeatureCropBand.Pin x={0.7} y={0.75} />
                        <FeatureCropBand.Pin x={0.7} y={0.81} />
                        <FeatureCropBand.Pin x={0.82} y={0.865} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>The leg that left</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>The leg that arrived</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Revert restores both</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={ArrowLeftRight} title={<Trans>Matches without perfect metadata</Trans>}>
                    <Trans>Amount + time-window matching catches transfers and refunds without perfect bank metadata</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ShieldCheck} title={<Trans>No silent guesses</Trans>}>
                    <Trans>Ambiguous matches stay as two untouched rows instead of a silent guess</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Link2} title={<Trans>Originals stay linked</Trans>}>
                    <Trans>Original entries stay linked under the consolidated transaction for full audit trail</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>
                            Counter-IBAN from Monobank as the primary signal; amount and time-window matching for banks that don&apos;t send
                            one
                        </Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Cross-currency: $1000 → €925 matches when the implied exchange rate is plausible</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why imported transactions need consolidation</Trans>}>
                    <p>
                        <Trans>
                            Two synced banks see the same transfer twice — once as a debit, once as a credit. Without consolidation, your
                            spending doubles. Budgie matches the pair using amount, a time window, and counter-IBAN when the bank provides
                            it.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Refunds have the opposite problem: a merchant credit can look like income even though it reverses an earlier
                            expense. Budgie consolidates clear refund matches automatically and leaves uncertain cases exactly as they
                            arrived.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>What if the algorithm misidentifies a match?</Trans>}
                    answer={
                        <Trans>
                            Manual override is one tap. Open the consolidated transaction, choose Revert, and Budgie restores the original
                            entries with their original categories.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Does this work across two different banks?</Trans>}
                    answer={
                        <Trans>
                            Yes. Monobank sends a counter-IBAN on every leg, so Budgie links those pairs directly. PrivatBank and Erste
                            don&apos;t expose a counterparty IBAN at all, so Budgie falls back to matching on amount and a time window
                            instead. For cross-currency pairs, an exchange-rate tolerance band confirms the match when the amounts differ
                            due to FX conversion.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>What about cross-currency transfers?</Trans>}
                    answer={
                        <Trans>
                            Pairs match if the implied FX rate falls within a plausible tolerance band. Both legs still need to land within
                            the same twelve-hour window as same-currency pairs. The original amounts in both currencies are preserved on
                            each leg.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Will old (already-imported) transactions get re-matched?</Trans>}
                    answer={
                        <Trans>
                            Yes. Each consolidation run rescans recent entries against existing ones, so transfers and refunds can match
                            retroactively when enough matching info arrives.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
