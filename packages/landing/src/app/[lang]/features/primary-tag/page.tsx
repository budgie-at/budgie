/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Hand, Star, Tag, Zap } from 'lucide-react';

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

export default async function PrimaryTagFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie transaction list where multi-tag rows show a bordered tag chip with a sibling count and single-tag rows show a plain chip`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Scan long lists at a glance</Trans>}
                tagline={
                    <Trans>
                        The first tag you add becomes the one the list shows. Long-press another tag in the picker to make it the main one
                        instead.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="primary-tag-1" slug="primary-tag" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Which tag chip the list shows</Trans>}>
                    <Trans>
                        A transaction can carry more than one tag. The list only has room for one chip, so Budgie picks which one to show.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Point index={0}>
                    <Trans>Tag a transaction more than once and the list still shows one chip — bordered, with a count for the rest.</Trans>
                </FeatureStory.Point>

                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="primary-tag-1" slug="primary-tag">
                    <FeatureStory.Callout index={0} y={0.344}>
                        <Trans>Bordered chip, plus a count</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.775}>
                        <Trans>One tag needs no border</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Point index={1}>
                    <Trans>
                        The first tag you pick is the one the list shows. To change it, open the tag picker and long-press another tag — a
                        star marks the main tag there.
                    </Trans>
                </FeatureStory.Point>
                <FeatureStory.Point index={2}>
                    <Trans>
                        The choice lives on the transaction itself, so editing anything else about it never resets which tag is shown.
                    </Trans>
                </FeatureStory.Point>
            </FeatureStory>

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(
                            i18n
                        )`Budgie tag picker sheet with a search box and a grid of tags such as Work, Family, Weekend and Groceries run`}
                        locale={lang}
                        scene="transaction-tags-1"
                        slug="transaction-tags"
                        y={0.57}
                    />
                }
                heading={<Trans>Pick your main tag yourself</Trans>}
                lede={<Trans>Open the tag picker on any transaction and long-press the tag you want shown.</Trans>}
            >
                <FeatureProof.Fact icon={Hand}>
                    <Trans>Long-press a tag to make it the main one</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={Star}>
                    <Trans>Selected tags carry a star, filled on the main one</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Action href={`/${lang}/features/transaction-tags`}>
                    <Trans>See how tags work</Trans>
                </FeatureProof.Action>
            </FeatureProof>

            <FeatureCropBand
                heading={<Trans>One chip, however many tags</Trans>}
                lede={<Trans>Each row shows its main tag and counts the rest.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(i18n)`Budgie transaction list where rows with several tags show a bordered tag chip with a plus-one count`}
                        locale={lang}
                        scene="primary-tag-1"
                        slug="primary-tag"
                        y={0.22}
                    >
                        <FeatureCropBand.Pin x={0.52} y={0.298} />
                        <FeatureCropBand.Pin x={0.82} y={0.27} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>The main tag, shown as a chip</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>A count of the other tags</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Tag} title={<Trans>Scan without opening rows</Trans>}>
                    <Trans>One tag chip per row on the transaction list — scan without opening rows</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Hand} title={<Trans>Pick the main tag</Trans>}>
                    <Trans>Long-press a tag in the picker to make it the main one</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Zap} title={<Trans>Nothing to set up</Trans>}>
                    <Trans>The first tag is main automatically, so there is nothing to set up</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>One per transaction — never ambiguous, always quick to scan</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>A star in the tag picker shows which tag is the main one</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why scanning a long list for one tag is hard</Trans>}>
                    <p>
                        <Trans>
                            Scanning a long transaction list for one tag is hard. Budgie shows the main tag of each row as a chip, with a
                            count of the others, so you can scan #vacation or #shared without opening anything.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            The first tag you add is the main one automatically. To pick a different one, long-press it in the tag picker;
                            the choice stays when you edit the transaction.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>What does &quot;primary&quot; actually do?</Trans>}
                    answer={
                        <Trans>
                            It decides which tag the list shows when a transaction has several. The row shows that tag as a chip with a
                            count of the others, so you can scan a long list for #vacation or #shared without opening any row.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>How do I set a primary tag?</Trans>}
                    answer={
                        <Trans>
                            You don&apos;t have to: the first tag you add is primary automatically. To change it, open the tag picker and
                            long-press the tag you want; a star marks it there.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Is the primary tag preserved across edits?</Trans>}
                    answer={
                        <Trans>Yes. Editing a transaction keeps its primary tag unless you pick a different one in the tag picker.</Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Can a transaction have several primary tags?</Trans>}
                    answer={<Trans>No. A tagged transaction has exactly one primary tag, the first one by default.</Trans>}
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
