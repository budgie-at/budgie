/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

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

export default async function DatabaseBackupFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);
    const storyAlt = t(
        i18n
    )`Budgie settings screen, Data Management section, listing the Import CSV, Export CSV, Import Database and Export Database rows`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Database Backup &amp; Restore</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Capture the whole Budgie database as one file — encrypted with your PIN when you set one — and put it back on
                        another device. No account, no upload.
                    </Trans>
                }
            />

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
                        hands it to the system share sheet as a dated budgie-backup file. Set a PIN and that same PIN is what the file is
                        encrypted with.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={storyAlt} index={0} locale={lang} priority scene="database-backup-1" slug="database-backup">
                    <FeatureStory.Callout y={0.54}>
                        <Trans>Writes the whole database</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Restore replaces what is there</Trans>}>
                    <Trans>
                        Import Database sits directly above it. Pick the file and Budgie warns you that it will replace all current data and
                        cannot be undone; confirm and it swaps everything in and restarts. A backup encrypted with a PIN asks for that PIN
                        first, and it becomes the app PIN on the restored data.
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

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why a backup file beats a vendor backup</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Cloud apps do &ldquo;backups&rdquo; by holding all your data on their servers. Budgie does backups by handing you
                        the database file. Where you put it is your business.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Restore lives in the same Settings list as the export. Pick the file, confirm the warning that it replaces
                        everything, and the app restarts on the restored database. No account is involved on either side.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>One file holds every transaction, account, category, tag and setting on your phone</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Set a PIN and the file is encrypted with it — no vendor format, no conversion step</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>
                            Restore from the same Settings list: pick the file, confirm the destructive replace, the app restarts on it
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>
                            Move to a new phone by exporting on the old one and importing on the new one — no account on either side
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>The export leaves through the system share sheet — Files, iCloud Drive, Drive, Dropbox or a USB stick</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>How do I restore on another device?</Trans>}
                    answer={
                        <Trans>
                            Install Budgie, open Settings and tap Import Database in the Data Management list. Pick the backup file and
                            confirm the warning. If the backup was encrypted with a PIN, Budgie asks for that PIN and keeps it as the lock
                            on the restored database; an unencrypted backup restores with no PIN set.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is the backup file safe to upload to a cloud?</Trans>}
                    answer={
                        <Trans>
                            If you have set a PIN, yes: the file is encrypted with that PIN, so a provider sees encrypted bytes rather than
                            your transactions. Without a PIN nothing is encrypted, so set one before the file leaves your device.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I have multiple backups?</Trans>}
                    answer={
                        <Trans>
                            Yes — every export is written with the date and time in its name, so files never overwrite each other. Snapshot
                            before a risky import or migration and keep the file around for rollback.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does Budgie auto-backup?</Trans>}
                    answer={
                        <Trans>
                            No. Exports are manual only — Budgie never writes a backup file on its own, and there is no scheduler and no
                            reminder to turn on. Nothing is written until you tap Export Database.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
