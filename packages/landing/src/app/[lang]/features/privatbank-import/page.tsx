/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import Link from 'next/link';
import { Copy, FileText, Tags } from 'reicon-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureCropBand } from '../../../../feature/component/feature-crop-band/feature-crop-band';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function PrivatbankImportFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Bring in your PrivatBank history</Trans>}
                tagline={
                    <Trans>
                        Import accounts and transactions from a Privat24 Excel export, with PrivatBank&apos;s own category names matched to
                        your Budgie categories automatically.
                    </Trans>
                }
            />

            <FeatureSpecTiles heading={<Trans>PrivatBank import at a glance</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>PrivatBank categories matched for you</Trans>} value={<Trans>Auto</Trans>}>
                    <Trans>Each PrivatBank category name is matched to a Budgie category.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>columns to map by hand</Trans>} value={<Trans>None</Trans>}>
                    <Trans>The Privat24 Excel export is read as it comes.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>to re-import the same export</Trans>} value={<Trans>Safe</Trans>}>
                    <Trans>Anything already imported is skipped.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureCropBand
                heading={<Trans>Switch on the accounts you want</Trans>}
                lede={<Trans>Budgie lists the card found in your export and imports only what you choose.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(i18n)`Budgie Import Privatbank screen with the card found in the export switched on and a Start Sync button`}
                        locale={lang}
                        scene="privatbank-import-2"
                        slug="privatbank-import"
                        y={0.1}
                    >
                        <FeatureCropBand.Pin x={0.62} y={0.19} />
                        <FeatureCropBand.Pin x={0.55} y={0.27} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>Select or deselect everything</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Your card, found in the export</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={FileText} title={<Trans>No column mapping</Trans>}>
                    <Trans>Reads the Privat24 Excel layout as exported — no manual column mapping</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Tags} title={<Trans>Categories matched for you</Trans>}>
                    <Trans>PrivatBank&apos;s own category names are matched to Budgie categories automatically</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Copy} title={<Trans>Safe to re-import</Trans>}>
                    <Trans>Dedupes against existing transactions on re-import</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>
                            Long-press a PrivatBank account card on the home screen to jump straight to the file picker for a fresh import
                        </Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Card and operation amounts and currencies are kept</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>One-time import per card or account — not a live sync, so re-run it whenever you want fresh data</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Categories arrive already matched</Trans>}>
                    <p>
                        <Trans>
                            This is a one-time import from a Privat24 statement export, not a live sync — each export covers a single card
                            or account, so a multi-card wallet needs one import per card.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            A Privat24 export is an Excel file with a fixed column layout: date and time, category, card, description, the
                            amount in the card and operation currencies, and the balance after each operation. Budgie reads all of it and
                            matches each PrivatBank category name to a Budgie category, so the Categorize inbox only has the leftovers to
                            sort.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Long-press a PrivatBank account card on the home screen to jump straight to the file picker for that account —
                            pick a fresh export and Budgie merges it in, skipping anything already imported.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            After each import, anything left without a category is ready for{' '}
                            <Link
                                className="font-semibold underline underline-offset-4"
                                href={`/${lang}/features/bulk-categorize-transactions`}
                            >
                                bulk categorization
                            </Link>
                            : one tap on a suggestion sorts a whole merchant group.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>How it works</Trans>}>
                    <p>
                        <Trans>
                            In the Privat24 app, select the card or account you want to import, open its statement, and choose a date range
                            covering your full history. Export it as Excel — PDF and CSV aren&apos;t accepted — and if Privat24 emails the
                            file instead of downloading it, save the attachment from your inbox. In Budgie, start a new account, choose
                            PrivatBank, and pick the saved file. Budgie checks it, reads the rows, and writes them to your selected account.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={2} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>How do I export from Privat24?</Trans>}
                    answer={
                        <Trans>
                            Open Privat24, select the card or account you want to import, and open its statement. Choose a date range that
                            covers your full history, then export it as Excel — PDF and CSV files can&apos;t be imported. If Privat24 emails
                            you the file instead of downloading it, save the attachment from your inbox, then pick it from Budgie&apos;s
                            file picker.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>How are PrivatBank categories handled?</Trans>}
                    answer={
                        <Trans>
                            Budgie matches each PrivatBank category name to a Budgie category, so analytics work the same as with other
                            bank-synced data. A name Budgie does not recognise stays uncategorized and waits in the Categorize inbox.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Is the long-press shortcut destructive?</Trans>}
                    answer={
                        <Trans>
                            No — long-press just opens the file picker for that account. Re-importing the same export again is safe;
                            anything already there is skipped.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Is this a live sync?</Trans>}
                    answer={
                        <Trans>
                            No. This is a one-time import from a Privat24 statement export, and each export only covers a single card or
                            account. Re-run the import whenever you want fresh data.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={4}
                    question={<Trans>Does it work offline?</Trans>}
                    answer={
                        <Trans>
                            Reading the file happens on your device. You only need internet to download the export from Privat24 in the
                            first place.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
