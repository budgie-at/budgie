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
import { FeatureProof } from '../../../../feature/component/feature-proof/feature-proof';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { FeatureVersus } from '../../../../feature/component/feature-versus/feature-versus';
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
                        One-tap CSV export of your transactions, plus a compressed full backup file you can save to iCloud, Drive, or
                        anywhere, locked with your PIN if you set one.
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
                        Export CSV takes your transactions in a single tap. There is no range to pick. Deleted transactions and the
                        originals behind a merged transaction are left out.
                    </Trans>
                </FeatureStory.Point>

                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="database-backup-1" slug="database-backup">
                    <FeatureStory.Callout index={0} y={0.365}>
                        <Trans>Your transactions, one file</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.538}>
                        <Trans>A backup of everything</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Point index={1}>
                    <Trans>
                        Export Database writes the whole database to one compressed file. The Import Database row directly above it restores
                        from that same file on another device.
                    </Trans>
                </FeatureStory.Point>
                <FeatureStory.Point index={2}>
                    <Trans>
                        Neither row is gated. No upgrade prompt, no vendor account, no plan — you save the file through the OS share sheet
                        to wherever you keep things.
                    </Trans>
                </FeatureStory.Point>
            </FeatureStory>

            <FeatureVersus
                heading={<Trans>Getting your data out</Trans>}
                lede={<Trans>Exports are often an afterthought. In Budgie they are two plain rows.</Trans>}
            >
                <FeatureVersus.Without title={<Trans>Many apps</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Export may sit behind a paid plan</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>A vendor account is often required</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Partial exports you reconcile later</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Backups held on company servers</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Budgie</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Both exports are free, no plan</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>No vendor account needed</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Your transactions in one tap</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Backups saved where you choose</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(
                            i18n
                        )`Budgie Settings Data Management section listing Import CSV, Export CSV, Import Database and Export Database rows`}
                        locale={lang}
                        scene="database-backup-1"
                        slug="database-backup"
                        y={0.3}
                    />
                }
                heading={<Trans>Check it in Settings</Trans>}
                lede={<Trans>Both exports are plain rows, each beside the import that reads the file back in.</Trans>}
            >
                <FeatureProof.Fact icon={FileSpreadsheet}>
                    <Trans>Export CSV takes your transactions in one tap</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={DatabaseBackup}>
                    <Trans>The backup export is a full copy you can restore from</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Action href={`/${lang}/features/database-backup`}>
                    <Trans>See how backup works</Trans>
                </FeatureProof.Action>
            </FeatureProof>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={FileSpreadsheet} title={<Trans>CSV for any spreadsheet</Trans>}>
                    <Trans>
                        CSV export with title, both accounts and amounts, currencies, category, MCC, date, comment, and the bank&apos;s
                        transaction id
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={DatabaseBackup} title={<Trans>Complete restore from one file</Trans>}>
                    <Trans>Compressed full backup file for a complete restore — PIN-locked if a PIN was set at export time</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={MousePointerClick} title={<Trans>Your transactions in one tap</Trans>}>
                    <Trans>One tap exports your whole history — no range to pick, and deleted or merged-away rows stay out</Trans>
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
                            Your data, your call. Budgie ships two exports: a flat CSV for spreadsheets and a compressed copy of your
                            database for a full restore. Both are user-initiated and saved through the OS share sheet.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            CSV columns map cleanly to most spreadsheet pivots: title, both accounts with their amounts and currencies,
                            category, MCC, date, comment, and the bank&apos;s own transaction id. There is no tags column, and built-in
                            system categories export blank. The database backup is a compressed copy of your data, so it is locked with your
                            PIN only if a PIN was set when you exported it.
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
                            CSV is for spreadsheets, tax software, and other apps that want flat data. The backup preserves all your data,
                            including what the CSV leaves out, for a full restore on a new device.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Is the backup encrypted?</Trans>}
                    answer={
                        <Trans>
                            Only if a PIN was set when you exported it: the backup is locked with your PIN if you had one set, and not
                            locked if you never did. Restoring a PIN-locked backup asks for the PIN that backup was made with, and that PIN
                            becomes the app PIN.
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
