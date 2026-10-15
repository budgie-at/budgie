/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Languages, Search, Smartphone, Type } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureProof } from '../../../../feature/component/feature-proof/feature-proof';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function AiCategoryTranslationFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie Edit Category screen for a category named Сільпо, with an AI-generated metadata block showing the English translation silpo supermarket and the search keywords groceries, supermarket, food, market, store, silpo`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Foreign category names, made readable</Trans>}
                tagline={
                    <Trans>
                        Category and tag names in non-Latin scripts, such as Cyrillic, get an English form and search keywords on your
                        device, without sending anything to a server.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="ai-category-translation-1" slug="ai-category-translation" />
            </FeaturePageHero>

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
                    alt={firstShotAlt}
                    index={0}
                    locale={lang}
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

            <FeatureSpecTiles heading={<Trans>Your names, readable everywhere</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>of your category names leave your phone</Trans>} value={<Trans>None</Trans>}>
                    <Trans>The English form is made on your device.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>names searchable, original and English</Trans>} value={<Trans>Both</Trans>}>
                    <Trans>Search finds it whichever form you remember.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>if the English form comes out wrong</Trans>} value={<Trans>Editable</Trans>}>
                    <Trans>Tap the English form or keywords to edit them.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(i18n)`Budgie Edit Category screen with the name Сільпо above an English translation and search keywords`}
                        locale={lang}
                        scene="ai-category-translation-1"
                        slug="ai-category-translation"
                        y={0.25}
                    />
                }
                heading={<Trans>Check it on one category</Trans>}
                lede={<Trans>Open any non-Latin category and look under the name.</Trans>}
            >
                <FeatureProof.Fact icon={Type}>
                    <Trans>Your original name stays exactly as you wrote it</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={Smartphone}>
                    <Trans>The English form is made on your phone</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Action href={`/${lang}/ai-features`}>
                    <Trans>See how on-device AI works</Trans>
                </FeatureProof.Action>
            </FeatureProof>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Languages} title={<Trans>Works across many scripts</Trans>}>
                    <Trans>Names in non-Latin scripts get an English translation, tested with Ukrainian</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Type} title={<Trans>Original names untouched</Trans>}>
                    <Trans>Original category and tag names stay untouched alongside the English form</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Search} title={<Trans>Search finds either form</Trans>}>
                    <Trans>Both forms are searchable — search finds the category or tag whichever one you remember</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>On your phone — no category or tag name ever leaves it</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Edit any category or tag if its English form comes back wrong</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why foreign category and tag names break expense search</Trans>}>
                    <p>
                        <Trans>
                            Categories and tags you create or import in Ukrainian or other non-Latin scripts are hard for search and
                            suggestions built around Latin text to find. Budgie translates each name into English, adds search keywords, and
                            keeps both forms. All of it happens on your phone, once On-device AI is on and its one-time download has
                            finished.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            The original name stays exactly as you wrote it; the English form is what your search queries also match
                            against. No data ever leaves your device. Renaming a category clears its English form and keywords, and Budgie
                            generates them again for the new name.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Which scripts are supported?</Trans>}
                    answer={
                        <Trans>
                            Names not written in the Latin alphabet are picked up for translation. We test it with Ukrainian; other
                            languages may work less well, so check the English form and edit it if needed.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Are my original category and tag names kept?</Trans>}
                    answer={
                        <Trans>
                            Yes. The original name stays exactly as you wrote it; the English form is what your search queries also match
                            against.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>What if a category or tag is translated wrongly?</Trans>}
                    answer={
                        <Trans>
                            Open the category or tag and edit its English form or keywords directly, or regenerate them. If you later rename
                            a category, its translation is reset and generated again.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Does this run on every category and tag?</Trans>}
                    answer={
                        <Trans>
                            New or renamed categories and tags without a saved English form are picked up automatically. Latin-alphabet
                            names skip translation but still get search keywords.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
