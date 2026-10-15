/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Hand, ListCheck, Mobile } from 'reicon-react';

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

export default async function TransactionLongPressMenuFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie transaction list with a context menu on one card offering edit, convert to transfer, attach debt and delete`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Long-press for quick actions</Trans>}
                tagline={
                    <Trans>
                        Long-press any transaction card for a menu: edit, delete, convert to a transfer, convert income to a refund, attach
                        a debt and more, without opening the full edit form.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot
                    alt={firstShotAlt}
                    locale={lang}
                    scene="transaction-long-press-menu-1"
                    slug="transaction-long-press-menu"
                />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Every change starts on the list</Trans>}>
                    <Trans>
                        Five screens: the press that opens the menu, the actions behind it, a transfer finished in one screen, and a refund
                        linked to the purchase it reverses.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Press and hold a row</Trans>}>
                    <Trans>The menu opens anchored to the card you pressed, and the rest of the list dims behind it.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={firstShotAlt}
                    index={0}
                    locale={lang}
                    scene="transaction-long-press-menu-1"
                    slug="transaction-long-press-menu"
                >
                    <FeatureStory.Callout y={0.3}>
                        <Trans>Hold any transaction card</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.408}>
                        <Trans>The menu opens right there</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Up to eight actions, no form</Trans>}>
                    <Trans>
                        Edit, convert to refund, convert to transfer, start a deposit, pay in parts, attach a debt, delete, or revert —
                        every one of them starts from the list, and each row shows only the ones that fit it.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie context menu open over the dimmed transaction list, with delete last and marked in red`}
                    index={1}
                    locale={lang}
                    scene="transaction-long-press-menu-1"
                    slug="transaction-long-press-menu"
                >
                    <FeatureStory.Callout y={0.449}>
                        <Trans>Convert it to a transfer</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>One screen to finish it</Trans>}>
                    <Trans>
                        Convert to Transfer opens with the amount already carried over. Pick the account on the other side and you are back
                        on the list.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie convert to transfer screen with the amount prefilled and the account picker open over the from and to selectors`}
                    index={2}
                    locale={lang}
                    scene="convert-to-transfer-1"
                    slug="convert-to-transfer"
                >
                    <FeatureStory.Callout y={0.3}>
                        <Trans>The amount carries over</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.79}>
                        <Trans>Pick the destination account</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={3} title={<Trans>A refund is not income</Trans>}>
                    <Trans>
                        Counting a merchant refund as earnings inflates every income report you run. Long-press the income row, choose
                        Convert to Refund, and Budgie lists the expenses it could be reversing — same currency, any account, and never
                        smaller than the refund itself.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Convert to Refund picker listing same-currency expenses with a search field and a disabled Convert button`}
                    index={3}
                    locale={lang}
                    scene="convert-to-refund-1"
                    slug="convert-to-refund"
                >
                    <FeatureStory.Callout y={0.249}>
                        <Trans>Likeliest match sorted first</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.855}>
                        <Trans>Search by merchant or account</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={4} title={<Trans>Link it to what it reverses</Trans>}>
                    <Trans>
                        Pick the expense and convert. The refund stops standing on its own: it attaches to that purchase, the expense is
                        marked Refunded, and analytics counts the purchase net of what came back — under its original category, not as new
                        income. Tap Revert on the refunded transaction to pull the two rows apart again.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Convert to Refund picker with one expense row selected and checked, and the Convert button now enabled`}
                    index={4}
                    locale={lang}
                    scene="convert-to-refund-2"
                    slug="convert-to-refund"
                >
                    <FeatureStory.Callout y={0.249}>
                        <Trans>Pick the expense it reverses</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.907}>
                        <Trans>Convert enables on selection</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureSpecTiles heading={<Trans>Everything you do to a transaction</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>actions behind one long-press</Trans>} value={<Trans>Up to 6</Trans>}>
                    <Trans>Not every action shows on every transaction. A single expense can show six.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>the actions that fit the row</Trans>} value={<Trans>Only</Trans>}>
                    <Trans>Refund shows for income, deposit for expenses.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>press and hold to open it</Trans>} value={<Trans>One</Trans>}>
                    <Trans>The menu opens next to the card you pressed.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureCropBand
                heading={<Trans>One short menu, right at the card</Trans>}
                lede={<Trans>Pick an action without leaving the list. Delete always comes last.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(
                            i18n
                        )`Budgie context menu with Edit Transaction, Convert to Transfer, Attach debt and a red Delete Transaction`}
                        locale={lang}
                        scene="transaction-long-press-menu-1"
                        slug="transaction-long-press-menu"
                        y={0.33}
                    >
                        <FeatureCropBand.Pin x={0.81} y={0.42} />
                        <FeatureCropBand.Pin x={0.81} y={0.455} />
                        <FeatureCropBand.Pin x={0.81} y={0.53} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>Edit it straight from the list</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Convert it to a transfer here</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Delete sits last, marked in red</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Hand} title={<Trans>Act straight from the list</Trans>}>
                    <Trans>Start any action from the list — long-press the row, then pick it</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ListCheck} title={<Trans>Only actions that apply</Trans>}>
                    <Trans>Context-aware menu — actions adapt to the transaction so you never see an option that does not apply</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Mobile} title={<Trans>One-handed, no extra screens</Trans>}>
                    <Trans>Gesture-driven flow — one-handed, no toolbar hunting, no extra navigation layer</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>One menu on every platform — no full-screen form to open first</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Actions belong on the list</Trans>}>
                    <p>
                        <Trans>
                            Editing a transaction in most expense apps means opening a detail screen, then an edit button, then a form.
                            Common operations like deleting a duplicate or reclassifying an expense as a transfer should not cost that much.
                            Budgie puts them behind a single long-press anchored to the transaction card itself.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            The menu opens next to the card you pressed, with no full-screen form to open first. The same menu opens on
                            every platform.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>How do I open the menu?</Trans>}
                    answer={<Trans>Press and hold any transaction card. Budgie&apos;s own menu appears next to the card.</Trans>}
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>What actions are available?</Trans>}
                    answer={
                        <Trans>
                            Edit, Convert to Refund, Convert to Transfer, Start Deposit, Pay in parts, Attach Debt, Delete, and Revert. The
                            exact set depends on the transaction — only income can become a refund, and Revert appears instead of Delete on
                            merged or refunded rows.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Can I customize the menu?</Trans>}
                    answer={
                        <Trans>Not yet. The menu surfaces the most common actions; let us know on GitHub if you want a custom slot.</Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Does this work on iPad?</Trans>}
                    answer={
                        <Trans>
                            Yes — the same popover menu opens on iPad, iPhone, and Android; there is no separate iPad presentation.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
