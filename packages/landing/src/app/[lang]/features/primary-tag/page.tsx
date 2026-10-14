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
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function PrimaryTagFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Scan long lists at a glance</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        The first tag you add becomes the one the list shows. Long-press another tag in the picker to make it the main one
                        instead.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Which tag chip the list shows</Trans>}>
                    <Trans>
                        A transaction can carry more than one tag. The list only has room for one chip, so Budgie picks which one to show.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Point index={0}>
                    <Trans>Tag a transaction more than once and the list still shows one chip — bordered, with a count for the rest.</Trans>
                </FeatureStory.Point>

                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie transaction list where multi-tag rows show a bordered tag chip with a sibling count and single-tag rows show a plain chip`}
                    index={0}
                    locale={lang}
                    priority
                    scene="primary-tag-1"
                    slug="primary-tag"
                >
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

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why scanning a long list for one tag is hard</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Scanning a long transaction list for one tag is hard. Budgie shows the main tag of each row as a chip, with a count
                        of the others, so you can scan #vacation or #shared without opening anything.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The first tag you add is the main one automatically. To pick a different one, long-press it in the tag picker; the
                        choice stays when you edit the transaction.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>One tag chip per row on the transaction list — scan without opening rows</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Long-press a tag in the picker to make it the main one</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>The first tag is main automatically, so there is nothing to set up</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>One per transaction — never ambiguous, always quick to scan</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>A star in the tag picker shows which tag is the main one</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>What does &quot;primary&quot; actually do?</Trans>}
                    answer={
                        <Trans>
                            It decides which tag the list shows when a transaction has several. The row shows that tag as a chip with a
                            count of the others, so you can scan a long list for #vacation or #shared without opening any row.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How do I set a primary tag?</Trans>}
                    answer={
                        <Trans>
                            You don&apos;t have to: the first tag you add is primary automatically. To change it, open the tag picker and
                            long-press the tag you want; a star marks it there.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is the primary tag preserved across edits?</Trans>}
                    answer={
                        <Trans>Yes. Editing a transaction keeps its primary tag unless you pick a different one in the tag picker.</Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can a transaction have several primary tags?</Trans>}
                    answer={<Trans>No. A tagged transaction has exactly one primary tag, the first one by default.</Trans>}
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
