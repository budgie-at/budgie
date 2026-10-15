/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { CalendarClock, Link2, Scale } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureCropBand } from '../../../../feature/component/feature-crop-band/feature-crop-band';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { FeatureVersus } from '../../../../feature/component/feature-versus/feature-versus';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function DebtTrackingFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie home screen scrolled to the You owe and Owed to you debt sections, each with a subtotal and a progress bar`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Know who owes whom</Trans>}
                tagline={
                    <Trans>
                        That €200 you lent your sister, the €1500 you owe a friend. Both are first-class accounts with target balances,
                        return dates, and contact assignment.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="debt-tracking-1" slug="debt-tracking" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Loans between people are accounts too</Trans>}>
                    <Trans>
                        Budgie tracks money you owe and money owed to you as first-class accounts, with a direction, a due date and a
                        running balance — and every euro that moves is a real expense or income, filed under Lending or Borrowing.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Money you owe, money owed to you</Trans>}>
                    <Trans>
                        Home groups debts by direction: You owe and Owed to you, each with its own subtotal and a bar for how far the debt
                        has been settled.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="debt-tracking-1" slug="debt-tracking">
                    <FeatureStory.Callout y={0.321}>
                        <Trans>Money you owe</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.565}>
                        <Trans>Money owed to you</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>A due date and a target</Trans>}>
                    <Trans>
                        Open a debt to see what is still to receive, how much has come back and the total you lent, against the target
                        balance and return date.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie debt account screen for Lent to Daniel showing $750 still to receive at 37.5% returned, with the returned and lent totals`}
                    index={1}
                    locale={lang}
                    scene="debt-tracking-2"
                    slug="debt-tracking"
                >
                    <FeatureStory.Callout y={0.238}>
                        <Trans>Still to receive</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.287}>
                        <Trans>Returned vs lent</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Attach a repayment you already logged</Trans>}>
                    <Trans>
                        When a repayment lands as ordinary income, open the transaction and pick the debt it belongs to. Budgie files it
                        under Lending or Borrowing and moves the debt&apos;s remaining balance, instead of you recording a second
                        transaction.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie income transaction detail with a debt account picker listing Lent to Daniel and Borrowed from Mom`}
                    index={2}
                    locale={lang}
                    scene="debt-tracking-3"
                    slug="debt-tracking"
                >
                    <FeatureStory.Callout y={0.708}>
                        <Trans>Attach to a debt</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.798}>
                        <Trans>Lent or borrowed</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureVersus
                heading={<Trans>A loan that stays in view</Trans>}
                lede={<Trans>Many people track loans in notes or a sheet. Here is the difference.</Trans>}
            >
                <FeatureVersus.Without title={<Trans>Notes or a spreadsheet</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Loans kept in a separate sheet</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Balances updated by hand</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Repayments typed in twice</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Net worth often ignores what you owe</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Debts live next to your accounts</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Loans sit beside your accounts</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Remaining balance moves for you</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Attach a repayment you already logged</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Net worth can include what you owe</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureCropBand
                heading={<Trans>What one loan looks like</Trans>}
                lede={<Trans>A debt account keeps score so you do not have to.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(
                            i18n
                        )`Budgie debt account screen for Lent to Daniel showing the amount still to receive, the returned and lent totals and the repayment below`}
                        locale={lang}
                        scene="debt-tracking-2"
                        slug="debt-tracking"
                        y={0.17}
                    >
                        <FeatureCropBand.Pin x={0.74} y={0.237} />
                        <FeatureCropBand.Pin x={0.5} y={0.285} />
                        <FeatureCropBand.Pin x={0.65} y={0.445} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>What is still to receive</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Returned so far against the total lent</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Each repayment, listed under the debt</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Scale} title={<Trans>Owe and owed, signed correctly</Trans>}>
                    <Trans>Explicit direction: &quot;I owe&quot; vs &quot;owes me&quot; — net worth signs them correctly</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={CalendarClock} title={<Trans>Targets and return dates</Trans>}>
                    <Trans>Target balance and return date for closing the loop</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Link2} title={<Trans>Repayments without re-entering</Trans>}>
                    <Trans>Attach an existing income or expense to a debt as a repayment, without inventing a second transaction</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Optional contact name — track inter-personal loans without spreadsheets</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>
                            Lending and repayments are categorized Lending or Borrowing automatically, and count toward your monthly
                            spending and income
                        </Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>
                            Paid off shows a clear done state and the debt leaves the home screen; repay too much and the overpaid amount is
                            shown
                        </Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Debts in another currency are valued with the exchange rate from the day the money actually moved</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why inter-personal debt deserves its own account type</Trans>}>
                    <p>
                        <Trans>
                            Inter-personal debt is invisible to most apps. Budgie has Debt as a real account type, with explicit &quot;I
                            owe&quot; / &quot;owes me&quot; direction, optional contact, target return date, and target balance.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Net worth respects debt direction: liabilities reduce, receivables increase. But no transaction ever touches the
                            debt account itself. Lending money books an expense; a repayment books an income — both on the account the money
                            actually moved through, both filed under Lending or Borrowing. The debt account only keeps score: remaining
                            against repaid, until the debt is paid off.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>What&apos;s the difference between &quot;I owe&quot; and &quot;owes me&quot;?</Trans>}
                    answer={
                        <Trans>
                            Direction. &quot;I owe&quot; is a liability — your net worth subtracts it. &quot;Owes me&quot; is a receivable —
                            your net worth adds it. Same account type, opposite sign.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>How do I settle a debt?</Trans>}
                    answer={
                        <Trans>
                            Record or attach the repayment as a normal income or expense — Budgie categorizes it Lending or Borrowing and
                            moves the remaining balance. No transfer ever touches the debt account itself. Once it&apos;s fully repaid the
                            debt shows a paid-off state and leaves the home screen; archive it from there to keep it in your history.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>My friend repaid me by bank transfer — do I have to re-enter it?</Trans>}
                    answer={
                        <Trans>
                            No. Attach the income that already arrived to the debt. Budgie categorizes it Lending automatically, moves the
                            debt&apos;s remaining balance, and the transaction stays exactly where your bank put it — still counted as
                            income.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>What if the loan was in a different currency?</Trans>}
                    answer={
                        <Trans>
                            The converted value is stored together with the exchange rate for the date of the operation, so an old loan
                            keeps the valuation it had when it was made instead of drifting with today&apos;s rate.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={4}
                    question={<Trans>Does the target return date trigger a reminder?</Trans>}
                    answer={
                        <Trans>
                            Currently it&apos;s informational — surfaced on the debt account card and in the account details view. Push
                            reminders are on the roadmap.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
