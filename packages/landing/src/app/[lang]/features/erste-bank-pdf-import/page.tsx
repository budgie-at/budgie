/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Eye, FileText, ScanText } from 'lucide-react';
import Link from 'next/link';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureCropBand } from '../../../../feature/component/feature-crop-band/feature-crop-band';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureVersus } from '../../../../feature/component/feature-versus/feature-versus';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function ErsteBankPdfImportFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Your Erste statement, imported</Trans>}
                tagline={
                    <Trans>
                        Import your full Erste Bank account statement straight from the PDF, including the new modern layout introduced in
                        2026.
                    </Trans>
                }
            />

            <FeatureVersus
                heading={<Trans>Statements without the retyping</Trans>}
                lede={<Trans>Copying a PDF statement by hand is slow and easy to get wrong. Budgie reads it for you.</Trans>}
            >
                <FeatureVersus.Without title={<Trans>Doing it by hand</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Copy each line from the PDF</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Re-importing can duplicate rows</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Find mistakes after saving</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Account details typed in yourself</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Budgie</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Pick the PDF, lines are read for you</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Known rows are skipped on re-import</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Preview the account before saving</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Account details read for you</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureCropBand
                heading={<Trans>Pick what to bring in</Trans>}
                lede={<Trans>Budgie finds the account in your statement and waits for your go.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(i18n)`Budgie Import Erste Bank screen listing the account found in the statement with a switch`}
                        locale={lang}
                        scene="erste-bank-pdf-import-1"
                        slug="erste-bank-pdf-import"
                        y={0.1}
                    >
                        <FeatureCropBand.Pin x={0.62} y={0.19} />
                        <FeatureCropBand.Pin x={0.6} y={0.27} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>Select all or pick accounts</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>The account found in the file</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={FileText} title={<Trans>Both statement layouts</Trans>}>
                    <Trans>Both Erste statement layouts supported: classic and the 2026 modern format</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ScanText} title={<Trans>Account details read for you</Trans>}>
                    <Trans>Account holder, IBAN, opening and closing balances all extracted automatically</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Eye} title={<Trans>Preview before anything is saved</Trans>}>
                    <Trans>Preview every parsed transaction before write — no surprises</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Booking date and value date both captured per transaction</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>MCC inferred from booking-text patterns where present</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why a dedicated parser beats a generic CSV converter</Trans>}>
                    <p>
                        <Trans>
                            Erste Bank does not expose a public API for personal accounts. PDF statements are the only export. Budgie ships
                            a parser tuned to the exact Erste statement layout — both the classic and the new 2026 modern format.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            The parser extracts account holder, IBAN, opening/closing balances, and every transaction line including value
                            date, booking date, and reference text. MCC is inferred from booking-text patterns where present.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Statement lines that still have no category wait in the{' '}
                            <Link
                                className="font-semibold underline underline-offset-4"
                                href={`/${lang}/features/bulk-categorize-transactions`}
                            >
                                Categorize inbox
                            </Link>
                            , grouped by merchant with suggestions from your past choices.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>How it works</Trans>}>
                    <p>
                        <Trans>
                            Tap Import → Erste PDF. Pick the file from Files. Budgie parses the document, shows a preview, and inserts every
                            transaction into a new or existing Erste account.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={2} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Which Erste statement formats are supported?</Trans>}
                    answer={
                        <Trans>
                            Both the classic layout and the modern format introduced in 2026 are parsed natively. If Erste rolls out another
                            redesign, the parser updates with the next release.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Will the parser get my IBAN right?</Trans>}
                    answer={
                        <Trans>
                            Yes — IBAN extraction is part of the header parse. The IBAN is stored on the account and enables automatic
                            transfer-pair detection between Erste and other accounts you own.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Can I re-import the same PDF safely?</Trans>}
                    answer={
                        <Trans>
                            Yes. Transactions deduplicate by their booking reference, so re-importing skips known rows and inserts only new
                            ones.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Does the parser run online?</Trans>}
                    answer={<Trans>No. PDF parsing happens entirely on-device — your statement never leaves your phone.</Trans>}
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
