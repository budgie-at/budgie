/* eslint-disable max-lines-per-function */
import { Trans } from '@lingui/react/macro';
import { Copy, FileSpreadsheet, Tags } from 'lucide-react';
import Link from 'next/link';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
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
                        Import accounts and transactions from a PrivatBank24 XLSX export, with PrivatBank&apos;s own MCC categories mapped
                        automatically.
                    </Trans>
                }
            />

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={FileSpreadsheet} title={<Trans>No column mapping</Trans>}>
                    <Trans>Native PrivatBank24 XLSX schema parser — no manual column mapping</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Tags} title={<Trans>Categories mapped for you</Trans>}>
                    <Trans>PrivatBank&apos;s proprietary MCC labels map to ISO MCC codes automatically</Trans>
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
                        <Trans>Currency, FX, and counterparty fields all preserved</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>One-time import per card or account — not a live sync, so re-run it whenever you want fresh data</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why MCC mapping matters for downstream automation</Trans>}>
                    <p>
                        <Trans>
                            This is a one-time import from a Privat24 statement export, not a live sync — each export covers a single card
                            or account, so a multi-card wallet needs one import per card.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            PrivatBank exports XLSX with a fixed schema and proprietary MCC labels. Budgie parses both, mapping each
                            PrivatBank category to the equivalent ISO MCC code so AI categorization downstream still works.
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
                            PrivatBank, and pick the saved file. Budgie validates it, parses the rows, and writes them to your selected
                            account.
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
                    question={<Trans>What about PrivatBank&apos;s custom MCC labels?</Trans>}
                    answer={
                        <Trans>
                            Budgie maps each PrivatBank category label to the corresponding ISO MCC code, so AI categorization, MCC chips,
                            and analytics all work the same as with other bank-synced data.
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
                            The parsing step is on-device. You only need internet to download the XLSX from PrivatBank24 in the first place.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
