/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Eye, PenLine, ShieldCheck, Wrench } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureProof } from '../../../../feature/component/feature-proof/feature-proof';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function SyncDataRepairsFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Duplicates and split transfers, fixed</Trans>}
                tagline={
                    <Trans>
                        When a bank sync re-delivers a transaction, or delivers one of your own transfers as two separate rows, Budgie finds
                        it and fixes it: duplicates get soft-deleted, unmatched transfer legs get paired into one.
                    </Trans>
                }
            />

            <FeatureSpecTiles heading={<Trans>Cleanup you stay in charge of</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>hand-typed entries touched</Trans>} value="0">
                    <Trans>Only imported rows are ever repaired. Your own entries stay as you typed them.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>shown before any change</Trans>} value={<Trans>A count</Trans>}>
                    <Trans>The screen tells you how many rows it would fix first.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>repairs in the background</Trans>} value={<Trans>None</Trans>}>
                    <Trans>Nothing runs until you press Repair.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(i18n)`Budgie Settings data management list with the Repair Sync Data and Consolidate Matches rows`}
                        locale={lang}
                        scene="database-backup-1"
                        slug="database-backup"
                        y={0.6}
                    />
                }
                heading={<Trans>Find it in Settings</Trans>}
                lede={<Trans>The repair has its own row in Settings, and it only acts after you confirm.</Trans>}
            >
                <FeatureProof.Fact icon={Wrench}>
                    <Trans>Repair Sync Data sits in the data section</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={ShieldCheck}>
                    <Trans>A confirmation card comes before every repair</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Source />
            </FeatureProof>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Eye} title={<Trans>See the count first</Trans>}>
                    <Trans>
                        A dedicated Settings screen scans your imported banking connections and shows a count before it changes anything
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={PenLine} title={<Trans>Hand-typed entries stay untouched</Trans>}>
                    <Trans>Soft-deletes duplicated imported rows — anything you typed yourself is never a candidate</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ShieldCheck} title={<Trans>Nothing runs unconfirmed</Trans>}>
                    <Trans>No repair runs until you confirm on the repair card — no background cleanup</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>
                            A per-source list, though paired own-card transfers are folded into one connection&apos;s count rather than
                            shown separately
                        </Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>An explicit empty state, “No sync repairs found”, when there is nothing to fix</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Runs against the local database — no upload, no server</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>
                            Also pairs unmatched own-card transfer legs into a real transfer — that&apos;s a rewrite, not a deletion, and it
                            can&apos;t be undone with one tap
                        </Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why duplicates appear at all</Trans>}>
                    <p>
                        <Trans>
                            A bank API can hand back the same transaction twice: a retried request, a resync window that overlaps the last
                            one, a connection that re-downloads a statement. Neither row is wrong on its own — they simply describe the same
                            event, and you see it twice.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            The Sync Data Repairs screen runs several checks in one pass: it finds duplicate imported rows, cleans up a few
                            rarer transfer-matching duplicates that only affect transfers, and looks for transfers between your own cards
                            that arrived as a separate income row and expense row instead of one transfer. It checks your imported banking
                            connections that support this repair today, shows a count before changing anything, and only touches the rows
                            involved once you confirm.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>When one card pays another</Trans>}>
                    <p>
                        <Trans>
                            Sometimes a transfer between your own cards arrives as two separate rows instead of one — an expense on the card
                            that sent it, an income on the card that received it. The repair finds those pairs and turns the unmatched row
                            into a proper transfer, rather than deleting anything.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            It only acts when the receiving card is no longer active on your account, when the masked card number on the
                            transaction matches exactly one of your closed cards, and when a matching entry turns up within about half a day
                            and within the expected amount. If the receiving card is still active, this repair leaves it alone — that&apos;s
                            by design, not a bug.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={2} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>What does a sync data repair actually do?</Trans>}
                    answer={
                        <Trans>
                            It runs several fixes on your imported banking connections: it soft-deletes duplicate imported rows, cleans up a
                            couple of rarer transfer-matching duplicates, and pairs transfers between your own cards that arrived as two
                            separate rows into one. The screen shows a count before you confirm anything.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Will it touch transactions I entered by hand?</Trans>}
                    answer={
                        <Trans>
                            No. The repair works on imported rows only. Manual transactions are never touched — that is exactly what the
                            confirmation card promises before you press Repair.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>What does the own-card transfer fix actually change?</Trans>}
                    answer={
                        <Trans>
                            It doesn&apos;t delete anything. It rewrites a synced income or expense row into a transfer, pointing it at the
                            closed card that received or sent it. That&apos;s a bigger change than a duplicate soft-delete, and unlike the
                            soft-delete it has no one-tap undo.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Why didn&apos;t it find my own-card transfer?</Trans>}
                    answer={
                        <Trans>
                            The receiving card has to be closed on your account, and its masked card number has to match exactly one of your
                            closed cards. A matching entry also has to turn up within about half a day and for the expected amount. If the
                            card is still active, or the masked number matches more than one closed card, the repair leaves it alone.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={4}
                    question={<Trans>Why do duplicates appear at all?</Trans>}
                    answer={
                        <Trans>
                            Bank APIs can re-deliver a transaction after a retry or an overlapping resync window. The repair finds those
                            repeated imported rows and removes the copies, not the original event.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
