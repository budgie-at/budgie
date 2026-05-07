import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { JsonLd } from '../../../generic/component/json-ld/json-ld';
import { initLingui } from '../../../i18n/init-lingui';
import { buildPillarHubJsonLd } from '../../util/build-pillar-hub-json-ld.util';
import { getPillarHubBySlug } from '../../util/get-pillar-hub-by-slug.util';
import { FeaturePageFaqItem } from '../feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../feature-page-heading/feature-page-heading';
import { FeaturePageProse } from '../feature-page-prose/feature-page-prose';
import { FeaturePageSection } from '../feature-page-section/feature-page-section';
import { PillarHubBreadcrumbs } from '../pillar-hub-breadcrumbs/pillar-hub-breadcrumbs';
import { PillarHubFeatureGrid } from '../pillar-hub-feature-grid/pillar-hub-feature-grid';
import { PillarHubHero } from '../pillar-hub-hero/pillar-hub-hero';
import { PillarHubSection } from '../pillar-hub-section/pillar-hub-section';

interface Props {
    readonly locale: string;
    readonly slug: string;
}

// eslint-disable-next-line max-lines-per-function -- Pillar hub page shell requires multiple sections and open-source prose blocks
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

            {isOpenSource && (
                <>
                    <FeaturePageSection>
                        <FeaturePageHeading>
                            <Trans>Read the Code, Verify the Claims</Trans>
                        </FeaturePageHeading>
                        <FeaturePageProse>
                            <Trans>
                                Budgie is open source under the MIT License. Every line of code that touches your financial data is publicly
                                readable on GitHub. Our privacy promises are not marketing — they are verifiable statements backed by code
                                you can audit yourself.
                            </Trans>
                        </FeaturePageProse>
                        <FeaturePageProse>
                            <Trans>
                                The repository includes the full React Native app, the AI service layer with on-device LLM and embedding
                                model integrations, the contracts package, and this landing page. Nothing is hidden behind a proprietary SDK
                                or closed binary.
                            </Trans>
                        </FeaturePageProse>
                    </FeaturePageSection>

                    <FeaturePageSection>
                        <FeaturePageHeading>
                            <Trans>Source-Available License — No Lock-In</Trans>
                        </FeaturePageHeading>
                        <FeaturePageProse>
                            <Trans>
                                Budgie ships under a source-available license that lets you read every line, fork it, and run your own
                                build. Your financial data belongs to you — not to a vendor who can change terms, raise prices, or shut
                                down. If Budgie ever stops meeting your needs, you take your data and your build with you.
                            </Trans>
                        </FeaturePageProse>
                        <FeaturePageProse>
                            <Trans>
                                Contributing is straightforward: open an issue, discuss the change, and submit a pull request. Features
                                requested by real users and built by real users have a direct path into the app without a gatekeeper
                                commercial roadmap.
                            </Trans>
                        </FeaturePageProse>
                    </FeaturePageSection>

                    <FeaturePageSection>
                        <FeaturePageHeading>
                            <Trans>Transparency as a Security Property</Trans>
                        </FeaturePageHeading>
                        <FeaturePageProse>
                            <Trans>
                                Open source is not just a development philosophy — it is a security property. Closed finance apps ask you to
                                trust that they do not log your transactions, share data with advertisers, or sell behavioral profiles.
                                Budgie asks you to check. The on-device architecture, AES-256 encryption, and zero-telemetry design are all
                                visible in the repository for any developer to verify.
                            </Trans>
                        </FeaturePageProse>
                    </FeaturePageSection>
                </>
            )}

            <FeaturePageFaqSection>
                {entry.faqs.map(faq => (
                    <FeaturePageFaqItem answer={i18n._(faq.answer)} key={i18n._(faq.question)} question={i18n._(faq.question)} />
                ))}
            </FeaturePageFaqSection>
        </main>
    );
};
