/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ArrowSwapHorizontal, Coins, Globe } from 'reicon-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureCropBand } from '../../../../feature/component/feature-crop-band/feature-crop-band';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function MultiCurrencyFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie home screen with a total balance above the Bank and Cash account groups, each group carrying its own subtotal and each account card its own currency`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Any currency, one total</Trans>}
                tagline={
                    <Trans>
                        Hold accounts in any currency. Budgie refreshes exchange rates in the background so your dashboards always show in
                        your home currency.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="multi-currency-1" slug="multi-currency" />
            </FeaturePageHero>

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
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="multi-currency-1" slug="multi-currency">
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

            <FeatureSpecTiles heading={<Trans>Built for more than one currency</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>account kept in its own currency</Trans>} value={<Trans>Every</Trans>}>
                    <Trans>Balances stay as they are. Converted totals sit on top.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>minutes at most between rate refreshes</Trans>} value="5">
                    <Trans>Budgie waits at least five minutes before asking again.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>accounts or keys needed for rates</Trans>} value={<Trans>None</Trans>}>
                    <Trans>Rates come from public sources your phone reaches directly.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureCropBand
                heading={<Trans>Read each card in its own money</Trans>}
                lede={<Trans>One screen shows the converted subtotal and the original balances.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(i18n)`Budgie home screen with the Bank group subtotal above a dollar account card and a euro account card`}
                        locale={lang}
                        scene="multi-currency-1"
                        slug="multi-currency"
                        y={0.35}
                    >
                        <FeatureCropBand.Pin x={0.62} y={0.38} />
                        <FeatureCropBand.Pin x={0.38} y={0.467} />
                        <FeatureCropBand.Pin x={0.38} y={0.585} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>Group subtotal, already converted</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>A dollar card in the group</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>A euro card below it</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Coins} title={<Trans>Every account in its own currency</Trans>}>
                    <Trans>Each account holds a fixed native currency — fiat, crypto, or otherwise</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Globe} title={<Trans>One total in your base currency</Trans>}>
                    <Trans>Home and analytics screens convert to your base currency automatically</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ArrowSwapHorizontal} title={<Trans>Transfers keep both amounts</Trans>}>
                    <Trans>Cross-currency transfers keep both amounts and the exchange rate at transfer time</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>The newest rate for every currency pair is stored on your device</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Totals are converted with the most recent rate Budgie fetched</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why a single-currency app can&apos;t model real life</Trans>}>
                    <p>
                        <Trans>
                            Single-currency apps can&apos;t model how most people actually save and spend — a UK current account, a USD
                            savings account, a UAH salary. Budgie tracks each in its native currency and converts to your base when summing.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Exchange rates refresh in the background and are stored on your device. Nothing is converted in place: every
                            account, transaction, and transfer keeps its original currency and amount, and the base-currency figure is
                            derived on top of it.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>How often do exchange rates refresh?</Trans>}
                    answer={
                        <Trans>
                            In the background, at intervals your phone&apos;s operating system chooses, and again whenever the app syncs —
                            but never more than once every five minutes. The newest rate for each currency pair replaces the one held on
                            your device.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Where do the rates come from?</Trans>}
                    answer={
                        <Trans>
                            Budgie fetches currency rates and crypto prices automatically over the internet. There is no account to create
                            and no key to paste in.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Can I see the original currency?</Trans>}
                    answer={
                        <Trans>
                            Yes — each account, transaction, and transfer keeps its original currency and amount, and that is what you see
                            on the account and transaction screens. Only the aggregated totals are shown in your base currency.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>What happens during a cross-currency transfer?</Trans>}
                    answer={
                        <Trans>
                            Both amounts are kept (e.g. $1000 → €925) along with the exchange rate at transfer time. See Account Transfers
                            for details.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
