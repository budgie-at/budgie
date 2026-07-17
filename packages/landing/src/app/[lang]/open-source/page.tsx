/* eslint-disable max-lines-per-function -- SEO page keeps unique content inline instead of registry-driven */
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeaturePageFaqItem } from '../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageProse } from '../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageSection } from '../../../feature/component/feature-page-section/feature-page-section';
import { PillarHubBreadcrumbs } from '../../../feature/component/pillar-hub-breadcrumbs/pillar-hub-breadcrumbs';
import { PillarHubHeroBulletItem } from '../../../feature/component/pillar-hub-hero-bullet-item/pillar-hub-hero-bullet-item';
import { PillarHubHeroBulletList } from '../../../feature/component/pillar-hub-hero-bullet-list/pillar-hub-hero-bullet-list';
import { PillarHubHero } from '../../../feature/component/pillar-hub-hero/pillar-hub-hero';
import { PillarHubPageShell } from '../../../feature/component/pillar-hub-page-shell/pillar-hub-page-shell';
import { buildPillarHubRouteMetadata } from '../../../feature/util/build-pillar-hub-route-metadata.util';
import { buildSoftwareSourceCodeJsonLd } from '../../../feature/util/build-software-source-code-json-ld.util';
import { JsonLd } from '../../../generic/component/json-ld/json-ld';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../i18n/init-lingui';

import { OPEN_SOURCE_PILLAR_HUB_METADATA } from './metadata';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildPillarHubRouteMetadata(i18n, OPEN_SOURCE_PILLAR_HUB_METADATA);
}

export default async function OpenSourcePillarHubPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    return (
        <>
            <JsonLd data={buildSoftwareSourceCodeJsonLd(lang)} />
            <PillarHubPageShell
                description={i18n._(OPEN_SOURCE_PILLAR_HUB_METADATA.metaDescription)}
                homeLabel={i18n._(msg`Home`)}
                locale={lang}
                publishedAt={OPEN_SOURCE_PILLAR_HUB_METADATA.publishedAt}
                slug={OPEN_SOURCE_PILLAR_HUB_METADATA.slug}
                title={i18n._(OPEN_SOURCE_PILLAR_HUB_METADATA.metaTitle)}
                updatedAt={OPEN_SOURCE_PILLAR_HUB_METADATA.updatedAt}
            >
                <PillarHubHero
                    breadcrumbs={<PillarHubBreadcrumbs current={i18n._(OPEN_SOURCE_PILLAR_HUB_METADATA.title)} locale={lang} />}
                    heading={<Trans>Source-Available Personal Finance — Transparent by Design</Trans>}
                    locale={lang}
                    tagline={
                        <Trans>
                            Budgie&apos;s source is public. Audit the code, verify our privacy claims, and contribute — because your
                            financial app should have nothing to hide.
                        </Trans>
                    }
                >
                    <PillarHubHeroBulletList>
                        <PillarHubHeroBulletItem>
                            <Trans>Source code is publicly available — read every line that touches your data</Trans>
                        </PillarHubHeroBulletItem>
                        <PillarHubHeroBulletItem>
                            <Trans>Privacy claims are verifiable, not just promised</Trans>
                        </PillarHubHeroBulletItem>
                        <PillarHubHeroBulletItem>
                            <Trans>Community contributions welcome — features built by people who use the app</Trans>
                        </PillarHubHeroBulletItem>
                        <PillarHubHeroBulletItem>
                            <Trans>Source-available license — fork it, run your own build, take your data with you</Trans>
                        </PillarHubHeroBulletItem>
                        <PillarHubHeroBulletItem>
                            <Trans>Transparent roadmap and public issue tracker</Trans>
                        </PillarHubHeroBulletItem>
                    </PillarHubHeroBulletList>
                </PillarHubHero>

                <FeaturePageSection>
                    <FeaturePageHeading>
                        <Trans>Read the Code, Verify the Claims</Trans>
                    </FeaturePageHeading>
                    <FeaturePageProse>
                        <Trans>
                            Budgie uses a source-available license that allows you to view, modify, and contribute to the code while
                            ensuring only we can monetize the official app. This keeps the project sustainable while maintaining
                            transparency.
                        </Trans>
                    </FeaturePageProse>
                    <FeaturePageProse>
                        <Trans>
                            The repository includes the full React Native app, the AI service layer with on-device LLM and embedding model
                            integrations, the contracts package, and this landing page. Nothing is hidden behind a proprietary SDK or closed
                            binary.
                        </Trans>
                    </FeaturePageProse>
                </FeaturePageSection>

                <FeaturePageSection>
                    <FeaturePageHeading>
                        <Trans>Source-Available License — No Lock-In</Trans>
                    </FeaturePageHeading>
                    <FeaturePageProse>
                        <Trans>
                            Budgie ships under a source-available license that lets you read every line, fork it, and run your own build.
                            Your financial data belongs to you — not to a vendor who can change terms, raise prices, or shut down. If Budgie
                            ever stops meeting your needs, you take your data and your build with you.
                        </Trans>
                    </FeaturePageProse>
                    <FeaturePageProse>
                        <Trans>
                            Contributing is straightforward: open an issue, discuss the change, and submit a pull request. Features
                            requested by real users and built by real users have a direct path into the app without a gatekeeper commercial
                            roadmap.
                        </Trans>
                    </FeaturePageProse>
                </FeaturePageSection>

                <FeaturePageSection>
                    <FeaturePageHeading>
                        <Trans>Transparency as a Security Property</Trans>
                    </FeaturePageHeading>
                    <FeaturePageProse>
                        <Trans>
                            Public source is not just a development philosophy — it is a security property. Closed finance apps ask you to
                            trust that they do not log your transactions, share data with advertisers, or sell behavioral profiles. Budgie
                            asks you to check. The on-device architecture, AES-256 encryption, and zero-telemetry design are all visible in
                            the repository for any developer to verify.
                        </Trans>
                    </FeaturePageProse>
                </FeaturePageSection>

                <FeaturePageFaqSection locale={lang}>
                    <FeaturePageFaqItem
                        answer={
                            <Trans>
                                Budgie&apos;s source code is hosted on GitHub. You can browse, fork, and contribute at
                                github.com/budgie-at/budgie. The repository includes the full app, AI service layer, contracts, and landing
                                page.
                            </Trans>
                        }
                        question={<Trans>Where can I find Budgie&apos;s source code?</Trans>}
                    />
                    <FeaturePageFaqItem
                        answer={
                            <Trans>
                                Budgie ships under a source-available license that lets you read, fork, and modify the code while reserving
                                commercial distribution to the project. There are no proprietary modules that touch your financial data —
                                every line that handles your transactions is in the public repository.
                            </Trans>
                        }
                        question={<Trans>What license does Budgie use?</Trans>}
                    />
                    <FeaturePageFaqItem
                        answer={
                            <Trans>
                                Public source means our privacy claims are verifiable. Any developer can audit the code and confirm that no
                                financial data is transmitted to external servers. You do not have to trust us — you can check.
                            </Trans>
                        }
                        question={<Trans>How does public source make Budgie more private?</Trans>}
                    />
                    <FeaturePageFaqItem
                        answer={
                            <Trans>
                                Yes. Pull requests, bug reports, and feature suggestions are welcome on the GitHub repository. The project
                                follows a standard fork-and-PR workflow with contribution guidelines in the repository.
                            </Trans>
                        }
                        question={<Trans>Can I contribute to Budgie?</Trans>}
                    />
                    <FeaturePageFaqItem
                        answer={
                            <Trans>
                                Yes. The AI service layer — including the embedding model integration and LLM orchestration — is part of the
                                public repository. The underlying models (Qwen3, whisper.rn) are separately licensed projects.
                            </Trans>
                        }
                        question={<Trans>Is the AI model integration also public source?</Trans>}
                    />
                </FeaturePageFaqSection>
            </PillarHubPageShell>
        </>
    );
}
