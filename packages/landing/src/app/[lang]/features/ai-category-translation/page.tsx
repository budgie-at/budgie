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
                        Category and tag names in non-Latin scripts, such as Cyrillic, get an English form and search keywords — on your
                        device, without sending anything to a server.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>One category, translated on your phone</Trans>}>
                    <Trans>
                        One screen: a category named in Ukrainian, with the English form and search keywords Budgie generated for it. It
                        needs On-device AI, which downloads its models once.
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
                        Categories and tags you create or import in Ukrainian or other non-Latin scripts are hard for search and suggestions
                        built around Latin text to find. Budgie translates each name into English, adds search keywords, and keeps both
                        forms. All of it happens on your phone, once On-device AI is on and its one-time download has finished.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The original name stays exactly as you wrote it; the English form is what your search queries also match against. No
                        data ever leaves your device. Renaming a category clears its English form and keywords, and Budgie generates them
                        again for the new name.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Names in non-Latin scripts get an English translation, tested with Ukrainian</Trans>
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

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Which scripts are supported?</Trans>}
                    answer={
                        <Trans>
                            Names not written in the Latin alphabet are picked up for translation. We test it with Ukrainian; other
                            languages may work less well, so check the English form and edit it if needed.
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
                            Open the category or tag and edit its English form or keywords directly, or regenerate them. If you later rename
                            a category, its translation is reset and generated again.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does this run on every category and tag?</Trans>}
                    answer={
                        <Trans>
                            New or renamed categories and tags without a saved English form are picked up automatically. Latin-alphabet
                            names skip translation but still get search keywords.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
