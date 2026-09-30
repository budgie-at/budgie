/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageFaqItem } from '../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/util/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function CsvImportFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);
    const storyAlt = t(
        i18n
    )`Budgie Map CSV Columns screen with the Budgie, SmartBudget and FinEye import presets above the To Account, Category, Date, Amount, To Currency and External ID column selectors`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>CSV Bank Statement Import</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Point Budgie at any CSV and map its columns onto Budgie&apos;s fields on one screen — or start from a built-in
                        preset and adjust.
                    </Trans>
                }
            />

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
                <FeatureStory.Shot alt={storyAlt} index={0} locale={lang} priority scene="csv-import-1" slug="csv-import">
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

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why CSV is the universal escape hatch</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Not every bank has an API, and not every app you are leaving will hand you anything but a spreadsheet. CSV is the
                        universal escape hatch — and Budgie reads it without forcing you into a specific column order.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The importer builds the ledger out of the file: accounts and categories are created from the values it finds, MCC
                        codes resolve to categories, and rows with both account legs become transfers. Dates are read as MM/DD/YYYY HH:MM:SS
                        or YYYY-MM-DD, and amounts use a dot as the decimal separator.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
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
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>
                            Map To Account, Category, Date, Amount and To Currency onto whichever columns your bank exports — your order,
                            not ours
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Built-in presets for Budgie&apos;s own export, SmartBudget and FinEye fill every selector in one tap</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Accounts and categories are created from the values in the file — nothing to set up beforehand</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Map both account legs and the row imports as one transfer rather than two unrelated entries</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Optional MCC, comment and External ID columns carry the bank&apos;s own detail into each transaction</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Will it work with my bank?</Trans>}
                    answer={
                        <Trans>
                            If your bank exports CSV, yes — you decide which column feeds each field. Dates need to read as MM/DD/YYYY
                            HH:MM:SS or YYYY-MM-DD, and amounts need a dot as the decimal separator.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does importing add to what I already have?</Trans>}
                    answer={
                        <Trans>
                            No. CSV import rebuilds the ledger from the file: existing accounts, categories and transactions are cleared
                            first. Treat it as the way to move in from another app, not as a monthly top-up.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does CSV import preserve the original transaction date?</Trans>}
                    answer={
                        <Trans>
                            Yes. The column you map to Date becomes the transaction&apos;s date, read as MM/DD/YYYY HH:MM:SS or YYYY-MM-DD.
                            A row whose date cannot be read is reported instead of guessed at.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I edit transactions after CSV import?</Trans>}
                    answer={
                        <Trans>
                            Always. Imported transactions are normal Budgie transactions — edit, split, tag, or convert to transfer just
                            like manual entries.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
