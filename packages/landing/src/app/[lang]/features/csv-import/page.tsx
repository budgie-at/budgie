/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import Link from 'next/link';
import { FileText, Layout, List, ListCheck, MagicWand } from 'reicon-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureProof } from '../../../../feature/component/feature-proof/feature-proof';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function CsvImportFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const storyAlt = t(
        i18n
    )`Budgie Map CSV Columns screen with the Budgie, SmartBudget and FinEye import presets above the To Account, Category, Date, Amount, To Currency and External ID column selectors`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Import a CSV from any bank</Trans>}
                tagline={
                    <Trans>
                        Point Budgie at any CSV and map its columns onto Budgie&apos;s fields on one screen, or start from a built-in preset
                        and adjust.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={storyAlt} locale={lang} scene="csv-import-1" slug="csv-import" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>One screen does the whole import</Trans>}>
                    <Trans>
                        Pick a CSV from Settings and Budgie reads its header row, then offers those headers to every field it needs to write
                        a transaction.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Any column order works</Trans>}>
                    <Trans>
                        Each field gets its own selector listing the headers found in your file, so nothing depends on the order your bank
                        chose. To Account, Category, Date, Amount and To Currency have to be mapped; the badge in the corner counts the rows
                        Budgie found.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={storyAlt} index={0} locale={lang} scene="csv-import-1" slug="csv-import">
                    <FeatureStory.Callout y={0.356}>
                        <Trans>One column per field</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.694}>
                        <Trans>Currency read from the file</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Start from a built-in preset</Trans>}>
                    <Trans>
                        Three presets ship with the app — Budgie&apos;s own export, SmartBudget and FinEye. Tapping one fills every selector
                        at once and tells you the columns are still yours to adjust.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={storyAlt} index={1} locale={lang} scene="csv-import-1" slug="csv-import">
                    <FeatureStory.Callout y={0.266}>
                        <Trans>Presets fill every field</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Optional columns carry the detail</Trans>}>
                    <Trans>
                        Map the second account leg and the row lands as a transfer instead of two unrelated entries. Map MCC and the
                        merchant code picks the category. External ID keeps your bank&apos;s own reference on the transaction.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={storyAlt} index={2} locale={lang} scene="csv-import-1" slug="csv-import">
                    <FeatureStory.Callout y={0.775}>
                        <Trans>External ID is optional</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureSpecTiles heading={<Trans>CSV import at a glance</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>built-in presets</Trans>} value="3">
                    <Trans>Pick one and every column mapping is filled in one tap.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>required columns, the rest optional</Trans>} value="5">
                    <Trans>Account, category, date, amount and currency are all you must map.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>column order works</Trans>} value={<Trans>Any</Trans>}>
                    <Trans>You choose which column feeds each field.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(i18n)`Budgie Map CSV Columns screen with import presets above required column selectors`}
                        locale={lang}
                        scene="csv-import-1"
                        slug="csv-import"
                        y={0.17}
                    />
                }
                heading={<Trans>See the mapping before you import</Trans>}
                lede={<Trans>Every field shows the column it will read, so you know where each value comes from.</Trans>}
            >
                <FeatureProof.Fact icon={ListCheck}>
                    <Trans>Five fields are required, the rest are optional</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={List}>
                    <Trans>A badge counts the rows Budgie found in your file</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Source />
            </FeatureProof>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Layout} title={<Trans>Any column order works</Trans>}>
                    <Trans>
                        Map To Account, Category, Date, Amount and To Currency onto whichever columns your bank exports — your order, not
                        ours
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={MagicWand} title={<Trans>One-tap import presets</Trans>}>
                    <Trans>Built-in presets for Budgie&apos;s own export, SmartBudget and FinEye fill every selector in one tap</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={FileText} title={<Trans>Nothing to set up first</Trans>}>
                    <Trans>Accounts and categories are created from the values in the file — nothing to set up beforehand</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Map both account legs and the row imports as one transfer rather than two unrelated entries</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Optional MCC, comment and External ID columns carry the bank&apos;s own detail into each transaction</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why CSV is the universal escape hatch</Trans>}>
                    <p>
                        <Trans>
                            Not every bank has an API, and not every app you are leaving will hand you anything but a spreadsheet. CSV is
                            the universal escape hatch — and Budgie reads it without forcing you into a specific column order.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            The importer builds the ledger out of the file: accounts and categories are created from the values it finds,
                            MCC codes resolve to categories, and rows with both account legs become transfers. Dates are read as MM/DD/YYYY
                            HH:MM:SS or YYYY-MM-DD, and amounts use a dot as the decimal separator.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Rows the file leaves without a category are grouped by merchant afterwards, so you can{' '}
                            <Link
                                className="font-semibold underline underline-offset-4"
                                href={`/${lang}/features/bulk-categorize-transactions`}
                            >
                                categorize them in bulk
                            </Link>{' '}
                            instead of one by one.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Will it work with my bank?</Trans>}
                    answer={
                        <Trans>
                            If your bank exports CSV, yes — you decide which column feeds each field. Dates need to read as MM/DD/YYYY
                            HH:MM:SS or YYYY-MM-DD, and amounts need a dot as the decimal separator.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Does importing add to what I already have?</Trans>}
                    answer={
                        <Trans>
                            No. CSV import rebuilds the ledger from the file: existing accounts, categories and transactions are cleared
                            first. Treat it as the way to move in from another app, not as a monthly top-up.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Does CSV import preserve the original transaction date?</Trans>}
                    answer={
                        <Trans>
                            Yes. The column you map to Date becomes the transaction&apos;s date, read as MM/DD/YYYY HH:MM:SS or YYYY-MM-DD.
                            A row whose date cannot be read is reported instead of guessed at.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Can I edit transactions after CSV import?</Trans>}
                    answer={
                        <Trans>
                            Always. Imported transactions are normal Budgie transactions — edit, split, tag, or convert to transfer just
                            like manual entries.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
