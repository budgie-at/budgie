/* eslint-disable max-lines-per-function */
import { Trans } from '@lingui/react/macro';
import { FileText, Scan, ShieldCheck } from 'reicon-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureVersus } from '../../../../feature/component/feature-versus/feature-versus';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function ReceiptScanningFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Scan a receipt, confirm the expense</Trans>}
                tagline={
                    <Trans>
                        Scan a receipt with the camera, or pick it from Photos or Files. Text is read on your iPhone and a readable receipt
                        opens a prefilled form for you to confirm.
                    </Trans>
                }
            />

            <FeatureSpecTiles heading={<Trans>From paper to a checked expense</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>ways to start a scan</Trans>} value={<Trans>Four</Trans>}>
                    <Trans>Camera, Photos, Files, or share a receipt into Budgie.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>where the receipt is read</Trans>} value={<Trans>On iPhone</Trans>}>
                    <Trans>Receipts are read on this device and never uploaded.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>expenses saved without you</Trans>} value={<Trans>None</Trans>}>
                    <Trans>Nothing is saved until you confirm the form.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureVersus
                heading={<Trans>Two ways to log a receipt</Trans>}
                lede={<Trans>Receipts pile up. What happens to them is the difference.</Trans>}
            >
                <FeatureVersus.Without title={<Trans>Type it in</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Total, date and shop typed by hand</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>The bank row and your entry both count</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>The paper receipt is lost or faded</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Scan it</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Total, date and shop come from the receipt</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>It attaches to the matching bank purchase</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>You confirm before it is saved</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Scan} title={<Trans>Scan from anywhere</Trans>}>
                    <Trans>
                        Use Scan receipt next to Expense in the create menu, the quick action on the home screen icon, or a tile in the
                        widget
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ShieldCheck} title={<Trans>Receipts stay on your iPhone</Trans>}>
                    <Trans>Text is read on the device and the receipt is not uploaded</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={FileText} title={<Trans>Matched to what you already have</Trans>}>
                    <Trans>A receipt attaches to the bank purchase it belongs to instead of adding a second expense</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Photos and PDF files can be picked from Photos or Files, or shared into Budgie</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>The form opens with the amount, shop name, date, a suggested category and the card&apos;s account</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Scanning the same receipt twice shows Already scanned; tap it to open the first transaction</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Your categorization rules apply to scanned receipts</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item title={<Trans>One receipt, no double counting</Trans>}>
                    <p>
                        <Trans>
                            After a scan, Budgie looks for a transaction with the same amount and currency from the day before the receipt
                            to five days after it. If a synced bank purchase fits, the form opens on that transaction and saving attaches
                            the receipt to it.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            If nothing fits, the form opens as a new expense. Later, when a bank row arrives for it, Budgie treats the
                            receipt expense as a likely duplicate and keeps the one with the receipt.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item title={<Trans>Always your decision</Trans>}>
                    <p>
                        <Trans>
                            A scan never creates or changes a transaction on its own. You see what Budgie read, fix anything that is wrong,
                            and save. If no receipt text is found, Budgie tells you so and nothing is created.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    question={<Trans>Does the receipt leave my iPhone?</Trans>}
                    answer={
                        <Trans>
                            No. Budgie reads the text on the device, and the camera and photo prompts say receipts are never uploaded. Your
                            expense is stored with the rest of your data on your iPhone.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>How do I start a scan?</Trans>}
                    answer={
                        <Trans>
                            Open the create menu and choose Scan receipt next to Expense, then pick Camera, Photos or Files. You can also
                            use the Scan receipt quick action on the app icon, the tile in the widget, or share a receipt into Budgie from
                            another app.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Will a scan add a duplicate of my bank purchase?</Trans>}
                    answer={
                        <Trans>
                            Not if the bank purchase is already in Budgie. The form opens on the matching transaction and saving attaches
                            the receipt to it. A receipt you scanned before is flagged as Already scanned.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Do my rules apply to scanned receipts?</Trans>}
                    answer={
                        <Trans>
                            Yes. Your categorization rules apply to scanned receipts like any other expense, and Budgie suggests a category
                            from the shops you have already filed.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Is receipt scanning available on Android?</Trans>}
                    answer={<Trans>No. Receipt scanning is available on iPhone and iPad.</Trans>}
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
