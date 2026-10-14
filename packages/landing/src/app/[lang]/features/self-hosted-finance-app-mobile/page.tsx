/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Database, Lock, ServerOff, Smartphone } from 'lucide-react';

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

export default async function SelfHostedFinanceAppMobilePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(i18n)`Budgie data management settings showing Import Database and Export Database rows`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Self-hosted privacy, no server</Trans>}
                tagline={
                    <Trans>
                        Self-hosting promises privacy but ships a server you have to babysit. Budgie gives you the same data ownership with
                        zero ops. Your phone is the server.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="database-backup-1" slug="database-backup" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Where the backup file replaces the server</Trans>}>
                    <Trans>One settings screen, and the two rows that stand in for everything a hosted server would do.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Point index={0}>
                    <Trans>
                        Every transaction, account and category lives in a database on your phone, encrypted the moment you set a PIN —
                        there is no backend to deploy.
                    </Trans>
                </FeatureStory.Point>

                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="database-backup-1" slug="database-backup">
                    <FeatureStory.Callout index={0} y={0.458}>
                        <Trans>Restore from a backup file</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.53}>
                        <Trans>Write your backup file here</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Point index={1}>
                    <Trans>
                        Export Database writes one file with everything, encrypted if you have a PIN set. Import Database restores it on a
                        new phone after you pick the file and enter that PIN if the backup was encrypted.
                    </Trans>
                </FeatureStory.Point>
                <FeatureStory.Point index={2}>
                    <Trans>No server to patch, renew certificates for, or pay for — just a file only you hold.</Trans>
                </FeatureStory.Point>
            </FeatureStory>

            <FeatureVersus
                heading={<Trans>A server to run, or just your phone</Trans>}
                lede={<Trans>Self-hosting keeps data yours but hands you the ops work. Budgie skips the server.</Trans>}
            >
                <FeatureVersus.Without title={<Trans>A self-hosted finance app</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Data lives on a server you run</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>You patch it and renew certificates</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Mobile is often just a web wrapper</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Setup can take hours</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Budgie</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Data lives on your phone</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>No server to maintain</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Native iOS and Android app</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Install and open</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(i18n)`Budgie Settings data management list with the Import Database and Export Database rows`}
                        locale={lang}
                        scene="database-backup-1"
                        slug="database-backup"
                        y={0.3}
                    />
                }
                heading={<Trans>Your backup is just a file</Trans>}
                lede={<Trans>Two rows in Settings save and restore everything. Keep the file wherever you like.</Trans>}
            >
                <FeatureProof.Fact icon={Database}>
                    <Trans>Export Database writes one file with all your data</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={Smartphone}>
                    <Trans>Import Database restores it on a new phone</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Source />
            </FeatureProof>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={ServerOff} title={<Trans>No server to maintain</Trans>}>
                    <Trans>No server to patch, renew certificates for, or pay for — just a file only you hold.</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Lock} title={<Trans>Your data on your phone</Trans>}>
                    <Trans>On your phone, encrypted when a PIN is set</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Smartphone} title={<Trans>A real mobile app</Trans>}>
                    <Trans>Native iOS + Android</Trans>
                </FeatureBenefits.Benefit>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why this matters</Trans>}>
                    <p>
                        <Trans>
                            Self-hosting promises privacy but ships a server you have to babysit. Budgie gives you the same data ownership
                            with zero ops — your phone is the server.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Why not just self-host an existing finance app?</Trans>}
                    answer={
                        <Trans>
                            If you enjoy ops work, do that. Most people don&apos;t, and a forgotten server with stale TLS is worse than a
                            vendor&apos;s cloud. Budgie keeps the data ownership story without the ops cost.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>How do I sync between phone and tablet?</Trans>}
                    answer={
                        <Trans>
                            Copy the backup file via your own iCloud Drive, Google Drive, or Dropbox — it is encrypted if you set a PIN when
                            you made it. Restore it on the second device by picking the file and entering that PIN.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>What if I want to migrate to a real self-hosted app later?</Trans>}
                    answer={<Trans>Export your data as CSV anytime. Budgie doesn&apos;t lock you in.</Trans>}
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Can I keep my data backed up to my own server?</Trans>}
                    answer={
                        <Trans>
                            Yes — the backup is just a file, encrypted if you had a PIN set when you made it. Save it anywhere you control:
                            NAS, S3, your own server, your own cloud.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
