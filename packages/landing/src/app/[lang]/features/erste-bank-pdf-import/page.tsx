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
import { createFeatureGenerateMetadata } from '../../../../feature/util/create-feature-generate-metadata.util';
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
                        Import your full Erste Bank account statement straight from the PDF — including the new modern layout introduced in
                        2026.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why a dedicated parser beats a generic CSV converter</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Erste Bank does not expose a public API for personal accounts. PDF statements are the only export. Budgie ships a
                        parser tuned to the exact Erste statement layout — both the classic and the new 2026 modern format.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The parser extracts account holder, IBAN, opening/closing balances, and every transaction line including value date,
                        booking date, and reference text. MCC is inferred from booking-text patterns where present.
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
                        <Trans>Both Erste statement layouts supported: classic and the 2026 modern format</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Account holder, IBAN, opening and closing balances all extracted automatically</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Booking date and value date both captured per transaction</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>MCC inferred from booking-text patterns where present</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Preview every parsed transaction before write — no surprises</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Tap Import → Erste PDF. Pick the file from Files. Budgie parses the document, shows a preview, and inserts every
                        transaction into a new or existing Erste account.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Which Erste statement formats are supported?</Trans>}
                    answer={
                        <Trans>
                            Both the classic layout and the modern format introduced in 2026 are parsed natively. If Erste rolls out another
                            redesign, the parser updates with the next release.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Will the parser get my IBAN right?</Trans>}
                    answer={
                        <Trans>
                            Yes — IBAN extraction is part of the header parse. The IBAN is stored on the account and enables automatic
                            transfer-pair detection between Erste and other accounts you own.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I re-import the same PDF safely?</Trans>}
                    answer={
                        <Trans>
                            Yes. Transactions deduplicate by their booking reference, so re-importing skips known rows and inserts only new
                            ones.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does the parser run online?</Trans>}
                    answer={<Trans>No. PDF parsing happens entirely on-device — your statement never leaves your phone.</Trans>}
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
