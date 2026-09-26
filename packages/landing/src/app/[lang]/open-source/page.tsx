/* eslint-disable max-lines, max-lines-per-function -- SEO page keeps unique content inline instead of registry-driven */
import { msg, t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeaturePageCategoryComparison } from '../../../feature/component/feature-page-category-comparison/feature-page-category-comparison';
import { FeaturePageFaqItem } from '../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageProse } from '../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageSection } from '../../../feature/component/feature-page-section/feature-page-section';
import { FeatureStory } from '../../../feature/component/feature-story/feature-story';
import { PillarHubBreadcrumbs } from '../../../feature/component/pillar-hub-breadcrumbs/pillar-hub-breadcrumbs';
import { PillarHubFeatureGrid } from '../../../feature/component/pillar-hub-feature-grid/pillar-hub-feature-grid';
import { PillarHubHeroBulletItem } from '../../../feature/component/pillar-hub-hero-bullet-item/pillar-hub-hero-bullet-item';
import { PillarHubHeroBulletList } from '../../../feature/component/pillar-hub-hero-bullet-list/pillar-hub-hero-bullet-list';
import { PillarHubHero } from '../../../feature/component/pillar-hub-hero/pillar-hub-hero';
import { PillarHubPageShell } from '../../../feature/component/pillar-hub-page-shell/pillar-hub-page-shell';
import { PillarHubSection } from '../../../feature/component/pillar-hub-section/pillar-hub-section';
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

                <PillarHubSection>
                    <PillarHubFeatureGrid>
                        <PillarHubFeatureGrid.Item
                            href={`/${lang}/features/self-hosted-finance-app-mobile`}
                            index={0}
                            tagline={
                                <Trans>
                                    Self-hosting promises privacy but ships a server you have to babysit. Budgie gives you the same data
                                    ownership with zero ops — your phone is the server.
                                </Trans>
                            }
                            title={<Trans>Self-Hosted Finance App on Mobile — Without Running a Server</Trans>}
                        />
                        <PillarHubFeatureGrid.Item
                            href={`/${lang}/features/subscription-free-budget-app`}
                            index={1}
                            tagline={<Trans>No monthly fee and no paid tier — every feature ships in the app you install.</Trans>}
                            title={<Trans>Subscription-Free Budget App</Trans>}
                        />
                        <PillarHubFeatureGrid.Item
                            href={`/${lang}/features/data-export`}
                            index={2}
                            tagline={<Trans>CSV for spreadsheets. A full database backup for restore. Both yours, never ours.</Trans>}
                            title={<Trans>Export Every Transaction You&apos;ve Logged</Trans>}
                        />
                        <PillarHubFeatureGrid.Item
                            href={`/${lang}/features/database-backup`}
                            index={3}
                            tagline={<Trans>One file. No account. Restore by picking it — encrypted if your PIN was set.</Trans>}
                            title={<Trans>Database Backup &amp; Restore</Trans>}
                        />
                    </PillarHubFeatureGrid>
                </PillarHubSection>

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
                            The repository includes the full mobile app, the on-device AI layer, the contracts package, and this landing
                            page. Nothing is hidden behind a proprietary SDK or closed binary.
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
                            asks you to check. The on-device architecture, encryption at rest, and zero-telemetry design are all visible in
                            the repository for any developer to verify.
                        </Trans>
                    </FeaturePageProse>
                </FeaturePageSection>

                <FeatureStory>
                    <FeatureStory.Intro heading={<Trans>Every promise here has a file behind it</Trans>}>
                        <Trans>One settings screen, and a public repository where every line of it can be checked.</Trans>
                    </FeatureStory.Intro>

                    <FeatureStory.Point index={0}>
                        <Trans>
                            Read the code that holds your money. The repository is the product, and nothing about how Budgie stores or
                            protects your data is compiled in secret.
                        </Trans>
                    </FeatureStory.Point>

                    <FeatureStory.Shot
                        alt={t(i18n)`Budgie settings screen listing the privacy, security and general options the app ships with`}
                        index={0}
                        locale={lang}
                        scene="open-source-budget-app-mobile-1"
                        slug="open-source-budget-app-mobile"
                    >
                        <FeatureStory.Callout index={0} y={0.262}>
                            <Trans>Read the code behind this claim</Trans>
                        </FeatureStory.Callout>
                        <FeatureStory.Callout index={1} y={0.403}>
                            <Trans>And the lock that enforces it</Trans>
                        </FeatureStory.Callout>
                    </FeatureStory.Shot>

                    <FeatureStory.Point index={1}>
                        <Trans>
                            Scroll Settings end to end and there is no analytics group, because there is no telemetry to switch off.
                        </Trans>
                    </FeatureStory.Point>
                    <FeatureStory.Point index={2}>
                        <Trans>Fork it if we disappear. The database format and the app are both yours to keep.</Trans>
                    </FeatureStory.Point>
                </FeatureStory>

                <FeaturePageSection>
                    <FeaturePageHeading>
                        <Trans>Feature comparison</Trans>
                    </FeaturePageHeading>
                    <FeaturePageCategoryComparison categoryLabel={<Trans>Closed-source budget apps</Trans>}>
                        <FeaturePageCategoryComparison.Row
                            budgieValue={<Trans>Public on GitHub</Trans>}
                            competitorValue={<Trans>Closed</Trans>}
                            label={<Trans>Source code</Trans>}
                        />
                        <FeaturePageCategoryComparison.Row
                            budgieValue={<Trans>Verifiable in source</Trans>}
                            competitorValue={<Trans>Marketing copy only</Trans>}
                            label={<Trans>Privacy claims</Trans>}
                        />
                        <FeaturePageCategoryComparison.Row
                            budgieValue={<Trans>Yes</Trans>}
                            competitorValue={<Trans>No</Trans>}
                            label={<Trans>Forkable</Trans>}
                        />
                        <FeaturePageCategoryComparison.Row
                            budgieValue={<Trans>Yes</Trans>}
                            competitorValue={<Trans>No</Trans>}
                            label={<Trans>Community PRs accepted</Trans>}
                        />
                        <FeaturePageCategoryComparison.Row
                            budgieValue={<Trans>Low — fork survives</Trans>}
                            competitorValue={<Trans>High — shutdown = data loss risk</Trans>}
                            label={<Trans>Vendor risk</Trans>}
                        />
                    </FeaturePageCategoryComparison>
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
                                Yes. The on-device AI layer that powers category suggestions, voice entry, and merchant clean-up is part of
                                the public repository. The pretrained models it runs are separately licensed third-party projects, credited
                                on our licence page.
                            </Trans>
                        }
                        question={<Trans>Is the AI model integration also public source?</Trans>}
                    />
                    <FeaturePageFaqItem
                        question={<Trans>Can I self-build?</Trans>}
                        answer={<Trans>Yes. The repository ships with build instructions for iOS and Android.</Trans>}
                    />
                    <FeaturePageFaqItem
                        question={<Trans>What if Budgie shuts down?</Trans>}
                        answer={
                            <Trans>
                                The code stays public. The community can keep building. Your data stays on your device regardless.
                            </Trans>
                        }
                    />
                </FeaturePageFaqSection>
            </PillarHubPageShell>
        </>
    );
}
