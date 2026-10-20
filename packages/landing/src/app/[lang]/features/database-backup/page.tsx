/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Database, Lock, Mobile } from 'reicon-react';

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

export default async function DatabaseBackupFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const storyAlt = t(
        i18n
    )`Budgie settings screen, Data Management section, listing the Import CSV, Export CSV, Import Database and Export Database rows`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Back up everything in one file</Trans>}
                tagline={
                    <Trans>
                        Capture the whole Budgie database as one compressed file, locked with your PIN when you set one, and put it back on
                        another device. No account, no upload.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={storyAlt} locale={lang} scene="database-backup-1" slug="database-backup" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Where a server would be, there is a file</Trans>}>
                    <Trans>
                        Settings keeps Export Database and Import Database as two neighbouring rows. Between them they do everything a
                        hosted account would have done.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>One file holds the database</Trans>}>
                    <Trans>
                        Export Database copies the whole file behind the app — every transaction, account, category, tag and setting — then
                        hands it to the system share sheet as a compressed, dated backup file. Set a PIN and that same PIN is what the file
                        is encrypted with.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={storyAlt} index={0} locale={lang} scene="database-backup-1" slug="database-backup">
                    <FeatureStory.Callout y={0.54}>
                        <Trans>Writes the whole database</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Restore replaces what is there</Trans>}>
                    <Trans>
                        Import Database sits directly above it. Pick the file and Budgie warns you that it will replace all current data and
                        cannot be undone; confirm and it swaps everything in and restarts. A PIN-locked backup asks for the PIN it was made
                        with first, and it becomes the app PIN on the restored data. A backup made by an older version of Budgie cannot be
                        restored.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={storyAlt} index={1} locale={lang} scene="database-backup-1" slug="database-backup">
                    <FeatureStory.Callout y={0.461}>
                        <Trans>Restore from a backup file</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Your file, your storage</Trans>}>
                    <Trans>
                        The share sheet is the last step Budgie takes part in. Send the file to Files, iCloud Drive, a Drive folder or a USB
                        stick, and keep as many dated copies as you want — the name carries the date and time, so exports never collide.
                    </Trans>
                </FeatureStory.Step>
            </FeatureStory>

            <FeatureSpecTiles heading={<Trans>Small enough to carry anywhere</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>file holds everything</Trans>} value={<Trans>One</Trans>}>
                    <Trans>Transactions, accounts, categories, tags and settings travel together.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>accounts needed</Trans>} value="0">
                    <Trans>Export on one phone and import on the next, no upload in between.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>name on every backup file</Trans>} value={<Trans>Dated</Trans>}>
                    <Trans>Each copy carries its date and time, so none overwrites another.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(i18n)`Budgie Settings Data Management section with the Import Database and Export Database rows`}
                        locale={lang}
                        scene="database-backup-1"
                        slug="database-backup"
                        y={0.4}
                    />
                }
                heading={<Trans>Back up and restore in Settings</Trans>}
                lede={<Trans>Export Database and Import Database sit side by side in Settings.</Trans>}
            >
                <FeatureProof.Fact icon={Mobile}>
                    <Trans>Export on one phone, import on another</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={Lock}>
                    <Trans>Locked with your PIN when you set one</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Source />
            </FeatureProof>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Database} title={<Trans>Everything in one file</Trans>}>
                    <Trans>One compressed file holds every transaction, account, category, tag and setting on your phone</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Lock} title={<Trans>Locked with your PIN</Trans>}>
                    <Trans>Set a PIN and the backup is locked with it — no vendor format, no conversion step</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Mobile} title={<Trans>Move to a new phone</Trans>}>
                    <Trans>Move to a new phone by exporting on the old one and importing on the new one — no account on either side</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>
                            Restore from the same Settings list: pick the file, confirm the destructive replace, the app restarts on it
                        </Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>The export leaves through the system share sheet — Files, iCloud Drive, Drive, Dropbox or a USB stick</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why a backup file beats a vendor backup</Trans>}>
                    <p>
                        <Trans>
                            Cloud apps do &ldquo;backups&rdquo; by holding all your data on their servers. Budgie does backups by handing
                            you the database file. Where you put it is your business.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Restore lives in the same Settings list as the export. Pick the file, confirm the warning that it replaces
                            everything, and the app restarts on the restored database. No account is involved on either side.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>How do I restore on another device?</Trans>}
                    answer={
                        <Trans>
                            Install Budgie, open Settings and tap Import Database in the Data Management list. Pick the backup file and
                            confirm the warning. If the backup is PIN-locked, Budgie asks for the PIN it was made with and keeps it as the
                            lock on the restored data; a backup made without a PIN restores with no PIN set. Backups made by an older
                            version of Budgie cannot be restored.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Is the backup file safe to upload to a cloud?</Trans>}
                    answer={
                        <Trans>
                            If you have set a PIN, yes: the backup is locked with that PIN, so a provider sees unreadable data rather than
                            your transactions. Without a PIN nothing is locked, so set one before the file leaves your device.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Can I have multiple backups?</Trans>}
                    answer={
                        <Trans>
                            Yes — every export is written with the date and time in its name, so files never overwrite each other. Snapshot
                            before a risky import or migration and keep the file around for rollback.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Does Budgie auto-backup?</Trans>}
                    answer={
                        <Trans>
                            No. Exports are manual only — Budgie never writes a backup file on its own, and there is no scheduler and no
                            reminder to turn on. Nothing is written until you tap Export Database.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
