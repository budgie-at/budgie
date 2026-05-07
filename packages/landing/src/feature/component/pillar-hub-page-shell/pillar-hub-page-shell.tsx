import { msg } from '@lingui/core/macro';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { JsonLd } from '../../../generic/component/json-ld/json-ld';
import { initLingui } from '../../../i18n/init-lingui';
import { buildPillarHubJsonLd } from '../../util/build-pillar-hub-json-ld.util';
import { getPillarHubBySlug } from '../../util/get-pillar-hub-by-slug.util';
import { FeaturePageFaqItem } from '../feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../feature-page-faq-section/feature-page-faq-section';
import { OpenSourcePillarHubContent } from '../open-source-pillar-hub-content/open-source-pillar-hub-content';
import { PillarHubBreadcrumbs } from '../pillar-hub-breadcrumbs/pillar-hub-breadcrumbs';
import { PillarHubFeatureGrid } from '../pillar-hub-feature-grid/pillar-hub-feature-grid';
import { PillarHubHero } from '../pillar-hub-hero/pillar-hub-hero';
import { PillarHubSection } from '../pillar-hub-section/pillar-hub-section';

interface Props {
    readonly locale: string;
    readonly slug: string;
}

export const PillarHubPageShell = ({ locale, slug }: Props) => {
    const i18n = initLingui(locale);
    const entry = getPillarHubBySlug(slug);
    if (!isDefined(entry)) {
        return null;
    }

    const [breadcrumbSchema, webPageSchema, faqSchema] = buildPillarHubJsonLd({
        locale,
        slug,
        title: i18n._(entry.metaTitle),
        description: i18n._(entry.metaDescription),
        homeLabel: i18n._(msg`Home`),
        faqs: entry.faqs.map(faq => ({ question: i18n._(faq.question), answer: i18n._(faq.answer) })),
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt
    });

    const isOpenSource = slug === 'open-source';
    const hasMemberFeatures = isNotEmptyArray(entry.memberFeatureSlugs);

    return (
        <main className="flex-1">
            <JsonLd data={breadcrumbSchema} />
            <JsonLd data={webPageSchema} />
            {isDefined(faqSchema) && <JsonLd data={faqSchema} />}

            <PillarHubHero
                breadcrumbs={<PillarHubBreadcrumbs current={i18n._(entry.title)} locale={locale} />}
                bullets={entry.heroBullets.map(bullet => i18n._(bullet))}
                heading={i18n._(entry.title)}
                locale={locale}
                tagline={i18n._(entry.tagline)}
            />

            {hasMemberFeatures && (
                <PillarHubSection>
                    <PillarHubFeatureGrid locale={locale} slugs={entry.memberFeatureSlugs} />
                </PillarHubSection>
            )}

            {isOpenSource && <OpenSourcePillarHubContent />}

            <FeaturePageFaqSection>
                {entry.faqs.map(faq => (
                    <FeaturePageFaqItem answer={i18n._(faq.answer)} key={i18n._(faq.question)} question={i18n._(faq.question)} />
                ))}
            </FeaturePageFaqSection>
        </main>
    );
};
