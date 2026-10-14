/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { DatabaseBackup, FileSpreadsheet, MousePointerClick } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function DataExportFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(i18n)`Budgie settings screen showing the data management section with Export CSV and Export Database rows`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Your data, yours to take</Trans>}
                tagline={
                    <Trans>
                        One-tap CSV export of all transactions, plus a full database backup file you can save to iCloud, Drive, or anywhere,
                        encrypted with your PIN if you set one.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="database-backup-1" slug="database-backup" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Two ways out, one screen</Trans>}>
                    <Trans>
                        Settings holds both exports as plain rows, each one sitting next to the import that reads the file back in.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Point index={0}>
                    <Trans>
                        Export CSV takes the whole ledger in a single tap. There is no range to pick and no partial file to reconcile later.
                    </Trans>
                </FeatureStory.Point>

                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="database-backup-1" slug="database-backup">
                    <FeatureStory.Callout index={0} y={0.365}>
                        <Trans>Every transaction, one file</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.538}>
                        <Trans>A backup of everything</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Point index={1}>
                    <Trans>
                        Export Database writes the whole database to one file. The Import Database row directly above it restores from that
                        same file on any device.
                    </Trans>
                </FeatureStory.Point>
                <FeatureStory.Point index={2}>
                    <Trans>
                        Neither row is gated. No upgrade prompt, no vendor account, no plan — you save the file through the OS share sheet
                        to wherever you keep things.
                    </Trans>
                </FeatureStory.Point>
            </FeatureStory>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={FileSpreadsheet} title={<Trans>CSV for any spreadsheet</Trans>}>
                    <Trans>
                        CSV export with title, both account legs and amounts, currencies, category, MCC, date, comment, and the bank&apos;s
                        transaction id
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={DatabaseBackup} title={<Trans>Complete restore from one file</Trans>}>
                    <Trans>Full database backup file for a complete restore — encrypted if a PIN was set at export time</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={MousePointerClick} title={<Trans>Whole history in one tap</Trans>}>
                    <Trans>One tap exports the whole history — no range to pick, no partial file to reconcile later</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Save through the OS share sheet — Files, iCloud, Drive, anything</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>No vendor account required — your data, your storage of choice</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why an expense app must respect the export</Trans>}>
                    <p>
                        <Trans>
                            Your data, your call. Budgie ships two exports: a flat CSV for spreadsheets and a copy of the database file
                            itself for a full restore. Both are user-initiated and saved through the OS share sheet.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            CSV columns map cleanly to most spreadsheet pivots: title, both account legs with their amounts and currencies,
                            category, MCC, date, comment, and the bank&apos;s own transaction id. The database backup is a byte-for-byte
                            copy of the database file, so it is encrypted only if a PIN was set when you exported it.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Why two export formats?</Trans>}
                    answer={
                        <Trans>
                            CSV is for spreadsheets, tax software, and other apps that want flat data. The database backup preserves every
                            relationship and account state for full restore on a new device.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Is the backup encrypted?</Trans>}
                    answer={
                        <Trans>
                            Only if a PIN was set when you exported it. The backup is a copy of the database file, so it carries whatever
                            state your data was in: encrypted with your PIN if you had one set, and unencrypted if you never did. Restoring
                            an encrypted backup asks for the PIN that backup was made with, and that PIN becomes the app PIN.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Can I import the CSV back into Budgie?</Trans>}
                    answer={
                        <Trans>
                            The CSV-import feature handles any flat CSV including ones Budgie produced — useful for round-tripping or
                            merging databases.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Does export work offline?</Trans>}
                    answer={
                        <Trans>
                            Yes. Both export flows produce files locally; you only need internet to upload them to a remote storage service.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
