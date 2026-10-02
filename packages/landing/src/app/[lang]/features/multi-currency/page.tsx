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
import { createFeatureGenerateMetadata } from '../../../../feature/util/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function MultiCurrencyFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Multi-Currency Accounts With Live Rates</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Hold accounts in any currency. Budgie refreshes exchange rates in the background so your dashboards always show in
                        your home currency.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Many currencies, one number</Trans>}>
                    <Trans>
                        One screen carries both: a total in the currency you picked, and the accounts underneath still holding whatever they
                        hold.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>One total, your base currency</Trans>}>
                    <Trans>
                        The figure at the top adds every account together and reports it in the base currency you set in Settings. Pick a
                        different base and the same accounts produce a different number.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie home screen with a total balance above the Bank and Cash account groups, each group carrying its own subtotal and each account card its own currency`}
                    index={0}
                    locale={lang}
                    priority
                    scene="multi-currency-1"
                    slug="multi-currency"
                >
                    <FeatureStory.Callout index={0} y={0.189}>
                        <Trans>Every account, added up once</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.442}>
                        <Trans>Group subtotal, already converted</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={2} y={0.543}>
                        <Trans>Held in its own currency</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Groups convert as they sum</Trans>}>
                    <Trans>
                        Bank and Cash each carry their own subtotal, converted the same way. A euro card can sit in the same group as a
                        dollar card and still roll into one figure.
                    </Trans>
                </FeatureStory.Step>

                <FeatureStory.Step index={2} title={<Trans>The accounts never convert</Trans>}>
                    <Trans>
                        Each card shows the balance in the currency that account is held in. Budgie stores the money as it is and derives
                        the converted figures on top, using the most recent rate it fetched and kept on your device.
                    </Trans>
                </FeatureStory.Step>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why a single-currency app can&apos;t model real life</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Single-currency apps can&apos;t model how most people actually save and spend — a UK current account, a Wise USD
                        pot, a UAH salary. Budgie tracks each in its native currency and converts to your base when summing.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Exchange rates refresh in the background and are stored on your device. Nothing is converted in place: every
                        account, transaction, and transfer leg keeps its original currency and amount, and the base-currency figure is
                        derived on top of it.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Each account holds a fixed native currency — fiat, crypto, or otherwise</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>The newest rate for every currency pair is stored on your device</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Home and analytics screens convert to your base currency automatically</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Totals are converted with the most recent rate Budgie fetched</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Cross-currency transfers preserve both legs and the FX rate at transfer time</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>How often do FX rates refresh?</Trans>}
                    answer={
                        <Trans>
                            In a background task while the app is closed, and again when you open it, with a short cooldown between
                            refreshes. The newest rate for each currency pair replaces the one held on your device.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Where do the rates come from?</Trans>}
                    answer={
                        <Trans>
                            Currency rates come from a free public endpoint at exchangerate-api.com, and crypto prices from CoinGecko. There
                            is no vendor account to create and no API key to paste in.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I see the original currency?</Trans>}
                    answer={
                        <Trans>
                            Yes — each account, transaction, and transfer leg keeps its original currency and amount, and that is what you
                            see on the account and transaction screens. Only the aggregated totals are shown in your base currency.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What happens during a cross-currency transfer?</Trans>}
                    answer={
                        <Trans>
                            Both legs are preserved (e.g. $1000 → €925) along with the FX rate at transfer time. See Account Transfers for
                            details.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
