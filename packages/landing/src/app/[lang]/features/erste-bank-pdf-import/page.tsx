/* eslint-disable max-lines-per-function */
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
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function ErsteBankPdfImportFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Erste Bank PDF Import</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Import your Erste Bank account statement straight from the PDF you download in George — EUR accounts at Erste Bank
                        Austria.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why a dedicated importer beats a generic CSV converter</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Budgie imports Erste Bank statements from the PDF you download in George, the Erste online banking. It is built
                        around the Erste Bank Austria statement layout and handles EUR accounts.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        From each statement Budgie reads the account&apos;s IBAN and closing balance, and every transaction line with its
                        date, amount and reference text. Card payments keep their city and country, and ATM withdrawals are recognised as
                        cash withdrawals.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
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
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Reads the statement PDF as downloaded from George — no manual column mapping</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>IBAN and closing balance read automatically</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>One date per transaction line, taken straight from the statement</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>ATM withdrawals recognised as cash withdrawals; city and country of card payments kept</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>See the accounts found in the statement and choose which to import before anything is written</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Start a new account and choose Erste Bank. In George, open Account → Statements and download the statement as a PDF,
                        then pick that file in Budgie. Budgie lists the accounts it finds in the statement, you switch on the ones you want,
                        and their transactions are imported.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Which Erste statements are supported?</Trans>}
                    answer={
                        <Trans>
                            PDF statements for EUR accounts at Erste Bank Austria, downloaded from George under Account → Statements.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Will Budgie get my IBAN right?</Trans>}
                    answer={<Trans>Yes — the IBAN is read from the statement header and stored on the account.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I re-import the same PDF safely?</Trans>}
                    answer={
                        <Trans>
                            Yes. Transactions you already imported are recognised, so re-importing skips known rows and adds only new ones.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does it need an internet connection?</Trans>}
                    answer={
                        <Trans>
                            Only to download the PDF from George. Reading the statement happens entirely on your device — it never leaves
                            your phone.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
