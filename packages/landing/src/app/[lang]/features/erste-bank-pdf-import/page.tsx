/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import Link from 'next/link';
import { Eye, FileText, Scan } from 'reicon-react';

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
                        Import your Erste Bank account statement straight from the PDF you download in George — EUR accounts at Erste Bank
                        Austria.
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
                <FeatureBenefits.Benefit icon={FileText} title={<Trans>Straight from George</Trans>}>
                    <Trans>Reads the statement PDF as downloaded from George — no manual column mapping</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Scan} title={<Trans>Account details read for you</Trans>}>
                    <Trans>IBAN and closing balance read automatically</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Eye} title={<Trans>Preview before anything is saved</Trans>}>
                    <Trans>See the accounts found in the statement and choose which to import before anything is written</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>One date per transaction line, taken straight from the statement</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>ATM withdrawals recognised as cash withdrawals; city and country of card payments kept</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why a dedicated importer beats a generic CSV converter</Trans>}>
                    <p>
                        <Trans>
                            Budgie imports Erste Bank statements from the PDF you download in George, the Erste online banking. It is built
                            around the Erste Bank Austria statement layout and handles EUR accounts.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            From each statement Budgie reads the account&apos;s IBAN and closing balance, and every transaction line with
                            its date, amount and reference text. Card payments keep their city and country, and ATM withdrawals are
                            recognised as cash withdrawals.
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
                            Start a new account and choose Erste Bank. In George, open Account → Statements and download the statement as a
                            PDF, then pick that file in Budgie. Budgie lists the accounts it finds in the statement, you switch on the ones
                            you want, and their transactions are imported.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={2} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Which Erste statements are supported?</Trans>}
                    answer={
                        <Trans>
                            PDF statements for EUR accounts at Erste Bank Austria, downloaded from George under Account → Statements.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Will Budgie get my IBAN right?</Trans>}
                    answer={<Trans>Yes — the IBAN is read from the statement header and stored on the account.</Trans>}
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Can I re-import the same PDF safely?</Trans>}
                    answer={
                        <Trans>
                            Yes. Transactions you already imported are recognised, so re-importing skips known rows and adds only new ones.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Does it need an internet connection?</Trans>}
                    answer={
                        <Trans>
                            Only to download the PDF from George. Reading the statement happens entirely on your device — it never leaves
                            your phone.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
