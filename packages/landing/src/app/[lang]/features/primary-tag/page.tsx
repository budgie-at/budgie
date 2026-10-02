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

export default async function PrimaryTagFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={featureName}
                locale={lang}
                tagline={
                    <Trans>
                        Promote one tag per transaction to &quot;primary&quot;; it pins as a corner-star badge on the list so you can scan
                        #vacation or #shared without opening anything.
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
                        Open the tag picker and long-press any tag to make it the one the list shows — no separate settings screen.
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
                        Scanning a long transaction list for one tag is hard. Budgie&apos;s primary-tag concept solves it visually — the
                        most important tag for that row gets a corner-star badge.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Long-press a tag chip on the card to rotate which one is primary. The choice persists across edits, and the badge
                        stays through bank-sync re-imports.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Corner-star badge on the transaction list — scan without opening rows</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Long-press to rotate which tag is primary — single gesture</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Persists across edits and bank-sync re-imports</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>One per transaction — never ambiguous, always quick to scan</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Optional — transactions without a primary tag stay clean and badge-free</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>What does &quot;primary&quot; actually do?</Trans>}
                    answer={
                        <Trans>
                            Visual emphasis. The primary tag renders as a corner-star badge on the transaction list so you can scan a long
                            list for #vacation or #shared without opening any row.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How do I set a primary tag?</Trans>}
                    answer={
                        <Trans>
                            Long-press a tag chip on the transaction card. The tap rotates which of that transaction&apos;s tags is primary.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is the primary tag preserved across edits?</Trans>}
                    answer={
                        <Trans>Yes. Editing a transaction keeps its primary-tag designation; bank-sync re-imports also preserve it.</Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can a transaction have no primary tag?</Trans>}
                    answer={<Trans>Yes — by default, none is primary. The badge appears only when you explicitly promote one.</Trans>}
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
