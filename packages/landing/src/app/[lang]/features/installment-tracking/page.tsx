/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { CalendarClock, ListChecks, RefreshCw } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureCropBand } from '../../../../feature/component/feature-crop-band/feature-crop-band';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { InstallmentPreview } from '../../../../feature/component/installment-preview/installment-preview';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function InstallmentTrackingFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Track what you still owe</Trans>}
                tagline={
                    <Trans>
                        Paid for a new phone in three parts? Turn the purchase into a plan in a few taps. Budgie attaches every monthly part
                        as it arrives and keeps the next payment on Home.
                    </Trans>
                }
            >
                <InstallmentPreview
                    caption={
                        <Trans>
                            Illustration: a purchase becomes a plan of three payments, and the Home card shows the amount still owed and the
                            next payment.
                        </Trans>
                    }
                >
                    <InstallmentPreview.Purchase
                        amount={t(i18n)`−$1,870.53`}
                        category={<Trans>Electronics & Gadgets</Trans>}
                        title={<Trans>Apple Store</Trans>}
                    />
                    <InstallmentPreview.Sheet
                        fee={<Trans>Fee 0%</Trans>}
                        heading={<Trans>Pay in parts</Trans>}
                        label={<Trans>Payments</Trans>}
                        parts={t(i18n)`3 × $1,870.53`}
                        selected={3}
                        total={t(i18n)`$5,611.59`}
                    />
                    <InstallmentPreview.Plan
                        eyebrow={<Trans>You owe</Trans>}
                        next={t(i18n)`Next $1,870.53 · Nov 6`}
                        outstanding={t(i18n)`$1,870.53`}
                        count={3}
                        paid={2}
                        title={<Trans>Apple Store</Trans>}
                        total={<Trans>of $5,611.59</Trans>}
                    />
                </InstallmentPreview>
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>One purchase, one plan, no spreadsheet</Trans>}>
                    <Trans>Convert the purchase once. Budgie follows the monthly parts and tells you what is left.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Turn a purchase into a plan</Trans>}>
                    <Trans>Open the expense, choose Pay in parts and pick the number of payments. The total updates as you tap.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie Pay in parts sheet for an electronics purchase with three payments selected and the plan total`}
                    index={0}
                    locale={lang}
                    priority
                    scene="installment-tracking-1"
                    slug="installment-tracking"
                />

                <FeatureStory.Step index={1} title={<Trans>Monthly parts attach themselves</Trans>}>
                    <Trans>When your bank syncs, Budgie finds next month&apos;s part on the same account and adds it to the plan.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie installment plan screen showing two of three payments paid, the next amount and its date`}
                    index={1}
                    locale={lang}
                    scene="installment-tracking-2"
                    slug="installment-tracking"
                />

                <FeatureStory.Step index={2} title={<Trans>The next payment, right on Home</Trans>}>
                    <Trans>Plans sit under You owe on Home, with what is left to pay and the amount and date of the next part.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie home screen with an installment plan card under You owe showing the next payment and the amount left`}
                    index={2}
                    locale={lang}
                    scene="installment-tracking-3"
                    slug="installment-tracking"
                />
            </FeatureStory>

            <FeatureSpecTiles heading={<Trans>The plan in numbers</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>payments at most in one plan</Trans>} value="24">
                    <Trans>Pick 2, 3, 4, 6, 10, 12 or 24 and watch the total update.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>days of slack when matching a part</Trans>} value="3">
                    <Trans>Next month&apos;s part attaches if it lands within three days of its due date.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>payment shown on Home</Trans>} value={<Trans>Next</Trans>}>
                    <Trans>Each plan with a part due shows its amount and date.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureCropBand
                heading={<Trans>Where a plan stands</Trans>}
                lede={<Trans>One screen shows what is left, what is paid and what is next.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(
                            i18n
                        )`Budgie installment plan screen with the amount left to repay, the repaid and total amounts, the paid count with the next payment and the first part below`}
                        locale={lang}
                        scene="installment-tracking-2"
                        slug="installment-tracking"
                        y={0.2}
                    >
                        <FeatureCropBand.Pin x={0.74} y={0.237} />
                        <FeatureCropBand.Pin x={0.5} y={0.285} />
                        <FeatureCropBand.Pin x={0.8} y={0.333} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>What is left to repay</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Repaid so far against the total</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Parts paid, and the next date</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={ListChecks} title={<Trans>Any purchase can become a plan</Trans>}>
                    <Trans>
                        Any expense can become a plan, from a bank&apos;s pay-in-parts service to a store&apos;s installment offer
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={RefreshCw} title={<Trans>Parts attach after each sync</Trans>}>
                    <Trans>Monthly parts are attached after each sync, matched by account, amount and due date</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={CalendarClock} title={<Trans>Next payment on Home</Trans>}>
                    <Trans>Every open plan appears under You owe on Home, next to your other debts</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Choose from 2 to 24 payments and watch the total and each part update live</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>The plan shows how many parts are paid, plus the next amount and its date</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>
                            Each part stays an ordinary expense in its category, so monthly spending shows what really left your account
                        </Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>A refunded purchase closes its plan at what you already paid</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>See the total before you commit</Trans>}>
                    <p>
                        <Trans>
                            Pick 2, 3, 4, 6, 10, 12 or 24 payments and the plan total and the size of each part change on the spot. Budgie
                            also shows the month each payment falls in, so you know when you are done.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            If your bank quoted a different total, type it in and Budgie works out the part from it. Paying a fee? The sheet
                            shows how much of that total is the fee.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>Returned it? The plan closes too</Trans>}>
                    <p>
                        <Trans>
                            Sent the phone back? Once the refund is linked to the purchase, Budgie closes the plan at the amount you already
                            paid. It stops showing a next payment and drops out of what you owe.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={2} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Which purchases can I turn into a plan?</Trans>}
                    answer={
                        <Trans>
                            Any expense with a single category that is not already linked to a debt or merged into another transaction.
                            Typical examples are monobank Покупка частинами, PrivatBank Оплата частинами and store installment offers.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>How does Budgie find the monthly parts?</Trans>}
                    answer={
                        <Trans>
                            After each sync it looks on the same account for an expense within three days of the due date with the amount of
                            the next part. If exactly one matches, it is attached to the plan. If several could match, Budgie leaves them
                            alone rather than guess.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>What if my bank charges a fee?</Trans>}
                    answer={
                        <Trans>
                            Enter the total your bank shows. The fee field shows how much of that total is the fee, and the parts are worked
                            out from the total.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>What happens if I return the item?</Trans>}
                    answer={
                        <Trans>
                            Once the refund is linked to the purchase in Budgie, the plan closes at the amount you already paid and no
                            longer shows a next payment.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={4}
                    question={<Trans>Where do I see what I still owe?</Trans>}
                    answer={
                        <Trans>
                            On Home under You owe, where each plan shows the next payment. Open a plan to see how many parts are paid. When
                            the last part arrives, it shows Paid off.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
