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

export default async function PrivatbankImportFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>PrivatBank XLSX Import</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Import accounts and transactions from a Privat24 Excel export — with PrivatBank&apos;s own category names matched to
                        your Budgie categories automatically.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Categories arrive already matched</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        This is a one-time import from a Privat24 statement export, not a live sync — each export covers a single card or
                        account, so a multi-card wallet needs one import per card.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        A Privat24 export is an Excel file with a fixed column layout: date and time, category, card, description, the
                        amount in the card and operation currencies, and the balance after each operation. Budgie reads all of it and
                        matches each PrivatBank category name to a Budgie category, so the Categorize inbox only has the leftovers to sort.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Long-press a PrivatBank account card on the home screen to jump straight to the file picker for that account — pick
                        a fresh export and Budgie merges it in, skipping anything already imported.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
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
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Reads the Privat24 Excel layout as exported — no manual column mapping</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>PrivatBank&apos;s own category names are matched to Budgie categories automatically</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>
                            Long-press a PrivatBank account card on the home screen to jump straight to the file picker for a fresh import
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Card and operation amounts and currencies are kept</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Dedupes against existing transactions on re-import</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>One-time import per card or account — not a live sync, so re-run it whenever you want fresh data</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        In the Privat24 app, select the card or account you want to import, open its statement, and choose a date range
                        covering your full history. Export it as Excel — PDF and CSV aren&apos;t accepted — and if Privat24 emails the file
                        instead of downloading it, save the attachment from your inbox. In Budgie, start a new account, choose PrivatBank,
                        and pick the saved file. Budgie checks it, reads the rows, and writes them to your selected account.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
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
                <FeaturePageFaqItem
                    question={<Trans>How are PrivatBank categories handled?</Trans>}
                    answer={
                        <Trans>
                            Budgie matches each PrivatBank category name to a Budgie category, so analytics work the same as with other
                            bank-synced data. A name Budgie does not recognise stays uncategorized and waits in the Categorize inbox.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is the long-press shortcut destructive?</Trans>}
                    answer={
                        <Trans>
                            No — long-press just opens the file picker for that account. Re-importing the same export again is safe;
                            anything already there is skipped.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is this a live sync?</Trans>}
                    answer={
                        <Trans>
                            No. This is a one-time import from a Privat24 statement export, and each export only covers a single card or
                            account. Re-run the import whenever you want fresh data.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does it work offline?</Trans>}
                    answer={
                        <Trans>
                            Reading the file happens on your device. You only need internet to download the export from Privat24 in the
                            first place.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
