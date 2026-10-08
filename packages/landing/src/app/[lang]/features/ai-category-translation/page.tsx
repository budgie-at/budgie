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

export default async function AiCategoryTranslationFeaturePage(props: PageLangParam) {
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
                        Category and tag names in Cyrillic, Greek, or Arabic get an English form — on your device, without sending anything
                        to a server.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>One category, translated on your phone</Trans>}>
                    <Trans>
                        One screen: a category named in Ukrainian, with the English form and search keywords Budgie generated for it.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>The name stays as you wrote it</Trans>}>
                    <Trans>
                        The category is called Сільпо, exactly as it was created. Below the name sits a block of AI-generated metadata,
                        produced on your phone.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Edit Category screen for a category named Сільпо, with an AI-generated metadata block showing the English translation silpo supermarket and the search keywords groceries, supermarket, food, market, store, silpo`}
                    index={0}
                    locale={lang}
                    priority
                    scene="ai-category-translation-1"
                    slug="ai-category-translation"
                >
                    <FeatureStory.Callout index={0} y={0.345}>
                        <Trans>Original name, untouched</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.449}>
                        <Trans>English translation</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={2} y={0.5}>
                        <Trans>Search keywords</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>An English form and search keywords</Trans>}>
                    <Trans>
                        Budgie adds an English translation and a list of search keywords next to the original name. Both are saved with the
                        category, so search and suggestions can find it whichever form you remember.
                    </Trans>
                </FeatureStory.Step>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why foreign category and tag names break expense search</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Categories and tags you create or import in Ukrainian, Greek, or Arabic script are unreadable to search and
                        suggestions built around Latin text. Budgie writes an English form for each one, adds search keywords, and keeps
                        both forms. All of it happens on your phone.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The original Cyrillic, Greek, or Arabic name stays exactly as you wrote it; the English form is what your search
                        queries also match against. No data ever leaves your device.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Cyrillic, Greek, Arabic, Chinese, Japanese, Korean, and more</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Original category and tag names stay untouched alongside the English form</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Both forms are searchable — search finds the category or tag whichever one you remember</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>On your phone — no category or tag name ever leaves it</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Edit any category or tag if its English form comes back wrong</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Each new category or tag joins a translation queue. Budgie proposes an English form plus search keywords, and saves
                        both alongside the original — so search and suggestions find it either way.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Which scripts are supported?</Trans>}
                    answer={
                        <Trans>
                            Cyrillic (Ukrainian, Russian, Bulgarian, Serbian), Greek, Arabic, Hebrew, Chinese, Japanese, Korean, Thai, and
                            more.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Are my original category and tag names kept?</Trans>}
                    answer={
                        <Trans>
                            Yes. The original name stays exactly as you wrote it; the English form is what your search queries also match
                            against.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if a category or tag is translated wrongly?</Trans>}
                    answer={
                        <Trans>
                            Open the category or tag and edit its English form or keywords directly. Your edit is permanent for that
                            category or tag.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does this run on every category and tag?</Trans>}
                    answer={
                        <Trans>
                            Only when needed. Latin-script names skip translation. Non-Latin names flow through the queue automatically
                            after you create or import them.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
