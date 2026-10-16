/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Archive, EyeOff, Palette, RotateLeft, Wallet } from 'reicon-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureCropBand } from '../../../../feature/component/feature-crop-band/feature-crop-band';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureProof } from '../../../../feature/component/feature-proof/feature-proof';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function AccountManagementFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie home screen with accounts grouped into Bank and Cash sections, each heading showing its own subtotal`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Every account, one home screen</Trans>}
                tagline={
                    <Trans>
                        Track unlimited bank accounts, cash wallets, deposits, crypto, and debt. Group, color, archive, and rename them
                        however you want.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="account-management-1" slug="account-management" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Many accounts, one balance sheet</Trans>}>
                    <Trans>
                        Three screens: the home list grouped by type, the form a new account type brings with it, and the archive that keeps
                        the accounts you closed.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Accounts group themselves by type</Trans>}>
                    <Trans>
                        Bank, cash, crypto, deposit and debt each get their own section on the home screen, and every section heading
                        carries the subtotal for the accounts under it.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="account-management-1" slug="account-management">
                    <FeatureStory.Callout y={0.177}>
                        <Trans>Total balance up top</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.436}>
                        <Trans>Every group carries a subtotal</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Each type brings its own form</Trans>}>
                    <Trans>
                        Picking Deposit opens the deposit form: opening balance, name, currency — then an interest rate and a maturity date
                        that only this type asks for.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie new deposit account form with currency, interest rate and maturity date fields`}
                    index={1}
                    locale={lang}
                    scene="account-management-3"
                    slug="account-management"
                >
                    <FeatureStory.Callout y={0.473}>
                        <Trans>Currency is fixed per account</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.595}>
                        <Trans>Interest rate, deposits only</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Archive instead of deleting</Trans>}>
                    <Trans>
                        An archived account leaves the home screen and the totals but keeps every transaction. Settings lists them, ready to
                        search and restore.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie archived accounts screen listing two archived accounts, each with a restore button`}
                    index={2}
                    locale={lang}
                    scene="account-management-2"
                    slug="account-management"
                >
                    <FeatureStory.Callout y={0.221}>
                        <Trans>Restore in one tap</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.832}>
                        <Trans>Search what you archived</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(i18n)`Budgie Archived Accounts screen listing two archived accounts, each with a restore button`}
                        locale={lang}
                        scene="account-management-2"
                        slug="account-management"
                        y={0.1}
                    />
                }
                heading={<Trans>Closed does not mean gone</Trans>}
                lede={<Trans>Archive an account to tidy up. Bring it back whenever you need it.</Trans>}
            >
                <FeatureProof.Fact icon={RotateLeft}>
                    <Trans>Restore any archived account from Settings</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={EyeOff}>
                    <Trans>Archived accounts stay out of your totals until restored</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Source />
            </FeatureProof>

            <FeatureCropBand
                heading={<Trans>A form that fits the account</Trans>}
                lede={<Trans>Deposits ask for the details that only deposits have.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(i18n)`Budgie deposit form with interest rate, maturity date and include in net worth fields`}
                        locale={lang}
                        scene="account-management-3"
                        slug="account-management"
                        y={0.5}
                    >
                        <FeatureCropBand.Pin x={0.78} y={0.575} />
                        <FeatureCropBand.Pin x={0.75} y={0.68} />
                        <FeatureCropBand.Pin x={0.68} y={0.785} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>Interest rate, if you know it</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Maturity date, when you want one</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Choose if it counts toward net worth</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Wallet} title={<Trans>Unlimited accounts, any type</Trans>}>
                    <Trans>
                        Unlimited accounts: Checking, Savings (cash), Crypto, Debt, Deposit — plus bank and Binance sync — each with its own
                        currency and balance
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Archive} title={<Trans>Archive without losing history</Trans>}>
                    <Trans>Archive without deleting, or mark inactive without archiving — both keep the full history</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Palette} title={<Trans>Readable at a glance</Trans>}>
                    <Trans>
                        Every account type carries its own color and icon, so a home screen with a dozen accounts still reads at a glance
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Bank-synced accounts auto-group by provider on the home screen</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>
                            Self-custodied coins group by currency with one combined balance and a tap through to that coin&rsquo;s market
                            screen; exchange-synced coins stay under their exchange
                        </Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Deposit accounts track maturity details; liability and debt accounts support negative balances</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>&ldquo;Include in net worth&rdquo; toggle per account for partial-truth balance sheets</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why real life is multi-account</Trans>}>
                    <p>
                        <Trans>
                            Real life is multi-account. A current account, a savings pot, a fixed-term deposit, a travel card, a crypto
                            wallet, a parental loan. Budgie treats each as a first-class account with its own currency, type, balance, and
                            &ldquo;include in net worth&rdquo; toggle.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Bank-synced accounts auto-group by provider on the home screen. Self-custodied crypto holdings group by currency
                            instead — several accounts holding the same coin collapse into one row with a combined balance, an expand
                            toggle, and a link straight to that coin&rsquo;s market screen. Liability and debt accounts support negative
                            balances. Archived accounts disappear from the home but stay searchable.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>Archive is not the same as inactive</Trans>}>
                    <p>
                        <Trans>
                            Two ways to get an account out of the way, for two different reasons. Archive it when you are done with it — an
                            archived account leaves the home screen and the totals but keeps every transaction, ready to search and restore.
                            Mark it inactive when it is still real but should not clutter the home screen — an inactive account stays out of
                            the daily list without being treated as closed. Both keep the full history.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={2} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Is there a limit on the number of accounts?</Trans>}
                    answer={
                        <Trans>
                            No. Add as many as you need — the home screen organizes them by type and provider so the list stays scannable.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Can I track an account in a different currency?</Trans>}
                    answer={
                        <Trans>
                            Yes. Each account has a fixed currency. Exchange rates, refreshed in the background, convert everything to your
                            base currency for net worth.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>What happens to transactions when I delete an account?</Trans>}
                    answer={
                        <Trans>
                            Deleting is permanent and only available for archived accounts: the account and its transactions are gone for
                            good, and there is no option to move them elsewhere first. Transfers with other accounts stay there as
                            &ldquo;Transfer (account deleted)&rdquo;. Archiving is the safer choice — it hides the account from the home but
                            keeps the data.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Can I track fixed-term deposits?</Trans>}
                    answer={
                        <Trans>
                            Yes. Deposit is a dedicated account type with interest rate, maturity date, days remaining, expected payout, and
                            a Close Deposit action that moves the balance to an account you pick and archives the deposit.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={4}
                    question={<Trans>Can I track loans I owe or money owed to me?</Trans>}
                    answer={
                        <Trans>
                            Yes. Debt is a dedicated account type with explicit &ldquo;I owe&rdquo; / &ldquo;owes me&rdquo; direction. See
                            Debt &amp; Loan Tracking for details.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
