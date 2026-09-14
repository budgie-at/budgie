/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBreadcrumbsJsonLd } from '../../../../feature/component/feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
import { FeaturePageCta } from '../../../../feature/component/feature-page-cta/feature-page-cta';
import { FeaturePageFaqItem } from '../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { FeaturePageWebPageJsonLd } from '../../../../feature/component/feature-page-web-page-json-ld/feature-page-web-page-json-ld';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildFeaturePageMetadata({
        locale: lang,
        slug: FEATURE_METADATA.slug,
        title: i18n._(FEATURE_METADATA.metaTitle),
        description: i18n._(FEATURE_METADATA.metaDescription),
        keywords: FEATURE_METADATA.seoKeywords.join(', '),
        publishedAt: FEATURE_METADATA.publishedAt,
        updatedAt: FEATURE_METADATA.updatedAt
    });
}

export default async function DatabaseBackupFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const description = i18n._(FEATURE_METADATA.metaDescription);
    const featureName = i18n._(FEATURE_METADATA.title);
    const title = i18n._(FEATURE_METADATA.metaTitle);
    const homePath = `/${lang}`;
    const featuresPath = `/${lang}/features`;
    const featurePath = `/${lang}/features/${FEATURE_METADATA.slug}`;
    const storyAlt = t(
        i18n
    )`Budgie settings screen, Data Management section, listing the Import CSV, Export CSV, Import Database and Export Database rows`;

    return (
        <main className="flex-1">
            <FeaturePageBreadcrumbsJsonLd locale={lang} slug={FEATURE_METADATA.slug}>
                <FeaturePageBreadcrumbsJsonLd.Item name={t(i18n)`Home`} path={homePath} />
                <FeaturePageBreadcrumbsJsonLd.Item name={t(i18n)`Features`} path={featuresPath} />
                <FeaturePageBreadcrumbsJsonLd.Item name={featureName} path={featurePath} />
            </FeaturePageBreadcrumbsJsonLd>
            <FeaturePageWebPageJsonLd
                description={description}
                featureName={featureName}
                locale={lang}
                publishedAt={FEATURE_METADATA.publishedAt}
                slug={FEATURE_METADATA.slug}
                title={title}
                updatedAt={FEATURE_METADATA.updatedAt}
            />
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Database Backup &amp; Restore</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Capture the whole Budgie database as one file — SQLCipher-encrypted with your PIN when you set one — and put it back
                        on another device. No account, no upload.
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
                        Export Database checkpoints the write-ahead log and copies the SQLite file itself — every transaction, account,
                        category, tag and setting — then hands it to the system share sheet as a dated budgie-backup file. Set a PIN and
                        that PIN is the SQLCipher key the file is encrypted with.
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
                        cannot be undone; confirm and it swaps the database in — write-ahead sidecars included — and restarts. A backup
                        encrypted with a PIN asks for that PIN first, and it becomes the app PIN on the restored database.
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
                        <Trans>
                            One file holds every transaction, account, category, tag and setting — it is the app&apos;s own SQLite database
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Set a PIN and the file is SQLCipher-encrypted with it — no vendor format, no conversion step</Trans>
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
                            If you have set a PIN, yes: the file is the SQLCipher database encrypted with that PIN, so a provider sees
                            encrypted bytes rather than your transactions. Without a PIN the database is not encrypted and neither is the
                            backup, so set one before the file leaves your device.
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

            <FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
