/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

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
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { InstallmentPreview } from '../../../../feature/component/installment-preview/installment-preview';
import { createFeatureGenerateMetadata } from '../../../../feature/util/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function InstallmentTrackingFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Know exactly what you still owe on things you bought in parts</Trans>}
                locale={lang}
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

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>See the total before you commit</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Pick 2, 3, 4, 6, 10, 12 or 24 payments and the plan total and the size of each part change on the spot. Budgie also
                        shows the date of the last payment, so you know when you are done.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        If your bank quoted a different total, type it in and Budgie works out the part from it. Paying a fee? Add the
                        percentage and the sheet shows how much of the total is the fee.
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
                            Any expense can become a plan, from a bank&apos;s pay-in-parts service to a store&apos;s installment offer
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Choose from 2 to 24 payments and watch the total and each part update live</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Monthly parts are attached after each sync, matched by account, amount and due date</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>The plan shows how many parts are paid, plus the next amount and its date</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Every open plan appears under You owe on Home, next to your other debts</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>
                            Each part stays an ordinary expense in its category, so monthly spending shows what really left your account
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={6}>
                        <Trans>A refunded purchase closes its plan at what you already paid</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Returned it? The plan closes too</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Sent the phone back? Once the refund is linked to the purchase, Budgie closes the plan at the amount you already
                        paid. It stops showing a next payment and drops out of what you owe.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Which purchases can I turn into a plan?</Trans>}
                    answer={
                        <Trans>
                            Any expense with a single category that is not already linked to a debt or merged into another transaction.
                            Typical examples are monobank Покупка частинами, PrivatBank Оплата частинами and store installment offers.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How does Budgie find the monthly parts?</Trans>}
                    answer={
                        <Trans>
                            After each sync it looks on the same account for an expense within three days of the due date with the amount of
                            the next part. If exactly one matches, it is attached to the plan. If several could match, Budgie leaves them
                            alone rather than guess.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if my bank charges a fee?</Trans>}
                    answer={
                        <Trans>
                            Enter the total your bank gave you, or add the fee percentage. The sheet shows how much of the total is the fee,
                            and the parts are worked out from the total.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if the last payment is a few cents different?</Trans>}
                    answer={
                        <Trans>
                            The last part is simply whatever is left on the plan, so rounding never leaves a plan open by a few cents.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What happens if I return the item?</Trans>}
                    answer={
                        <Trans>
                            Once the refund is linked to the purchase in Budgie, the plan closes at the amount you already paid and no
                            longer shows a next payment.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does a plan change my spending analytics?</Trans>}
                    answer={
                        <Trans>
                            No. Each part stays an ordinary expense in its category on the day it left your account. The plan only keeps
                            score of what is paid and what is left.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Where do I see what I still owe?</Trans>}
                    answer={
                        <Trans>
                            On Home under You owe, where each plan shows the next payment. Open a plan to see how many parts are paid. When
                            the last part arrives, it shows Paid off.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
