/* eslint-disable max-lines, max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import { isDefined } from '@rnw-community/shared';

import { BlogArticleContent } from '../../../../blog/component/blog-article-content/blog-article-content';
import { BlogArticleCta } from '../../../../blog/component/blog-article-cta/blog-article-cta';
import { BlogArticleHeading } from '../../../../blog/component/blog-article-heading/blog-article-heading';
import { BlogArticleHero } from '../../../../blog/component/blog-article-hero/blog-article-hero';
import { BlogArticleList } from '../../../../blog/component/blog-article-list/blog-article-list';
import { BlogArticleListItem } from '../../../../blog/component/blog-article-list-item/blog-article-list-item';
import { BlogArticleMeta } from '../../../../blog/component/blog-article-meta/blog-article-meta';
import { BlogArticleProse } from '../../../../blog/component/blog-article-prose/blog-article-prose';
import { BlogArticleSection } from '../../../../blog/component/blog-article-section/blog-article-section';
import { BlogArticleSubheading } from '../../../../blog/component/blog-article-subheading/blog-article-subheading';
import { BlogBreadcrumbCurrent } from '../../../../blog/component/blog-breadcrumb-current/blog-breadcrumb-current';
import { BlogBreadcrumbLink } from '../../../../blog/component/blog-breadcrumb-link/blog-breadcrumb-link';
import { BlogBreadcrumbs } from '../../../../blog/component/blog-breadcrumbs/blog-breadcrumbs';
import { BlogFaqItem } from '../../../../blog/component/blog-faq-item/blog-faq-item';
import { BlogFaqSection } from '../../../../blog/component/blog-faq-section/blog-faq-section';
import { BlogPostingJsonLd } from '../../../../blog/component/blog-posting-json-ld/blog-posting-json-ld';
import { RelatedArticles } from '../../../../blog/component/related-articles/related-articles';
import { ARTICLE_REGISTRY } from '../../../../blog/constant/article-registry.constant';
import { buildBlogArticleMetadata } from '../../../../blog/util/build-blog-article-metadata.util';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FEATURE_REGISTRY } from '../../../../feature/constant/feature-registry.constant';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';
import { Badge } from '../../../../ui/badge';

import type { Metadata } from 'next';

const SLUG = 'open-source-budgeting-transparency';
const DATE = '2025-02-12';
// eslint-disable-next-line lingui/no-unlocalized-strings
const AUTHOR = 'Budgie Team';
const IMAGE = '/images/design-mode/ai-budgeting-app-4x.jpg';
const READING_TIME = 15;

const RELATED_SLUGS = ['budgie-offline-financial-data', 'local-first-movement-developers'] as const;

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildBlogArticleMetadata({
        author: AUTHOR,
        date: DATE,
        description: t(
            i18n
        )`Discover why source-available budgeting apps provide unmatched transparency and security for your financial data. Learn to audit code yourself and why Budgie's public development model keeps your money private.`,
        image: IMAGE,
        keywords: t(i18n)`source-available budgeting, financial transparency, budget app security, public source finance`,
        locale: lang,
        slug: SLUG,
        title: t(i18n)`Source-Available Budgeting: Why Transparency Matters for Your Money`
    });
}

export default async function OpenSourceBudgetingTransparencyArticle(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const articleEntry = ARTICLE_REGISTRY.find(item => item.slug === SLUG);
    const relatedFeatures =
        articleEntry?.relatedFeatureSlugs.map(slug => FEATURE_REGISTRY.find(feature => feature.slug === slug)).filter(isDefined) ?? [];

    return (
        <main className="flex-1">
            <BlogPostingJsonLd
                author={AUTHOR}
                blogLabel={t(i18n)`Blog`}
                date={DATE}
                description={t(
                    i18n
                )`Discover why source-available budgeting apps provide unmatched transparency and security for your financial data.`}
                homeLabel={t(i18n)`Home`}
                image={IMAGE}
                keywords={t(i18n)`source-available budgeting, financial transparency, budget app security, public source finance`}
                locale={lang}
                slug={SLUG}
                title={t(i18n)`Source-Available Budgeting: Why Transparency Matters for Your Money`}
            />

            <BlogArticleHero image={IMAGE} imageAlt={t(i18n)`Open-source budgeting transparency`}>
                <Link
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                    href={`/${lang}/blog`}
                >
                    <Trans>← Back to Blog</Trans>
                </Link>

                <BlogBreadcrumbs>
                    <BlogBreadcrumbLink href={`/${lang}`} position={1}>
                        <Trans>Home</Trans>
                    </BlogBreadcrumbLink>
                    <BlogBreadcrumbLink href={`/${lang}/blog`} position={2}>
                        <Trans>Blog</Trans>
                    </BlogBreadcrumbLink>
                    <BlogBreadcrumbCurrent position={3}>
                        <Trans>Source-Available Budgeting: Why Transparency Matters for Your Money</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    <Trans>Source-Available Budgeting: Why Transparency Matters for Your Money</Trans>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                    <Trans>
                        Discover why source-available budgeting apps provide unmatched transparency and security for your financial data.
                    </Trans>
                </p>

                <BlogArticleMeta
                    author={AUTHOR}
                    date={DATE}
                    locale={lang}
                    readingTimeMinutes={READING_TIME}
                    tags={
                        <>
                            <Badge variant="secondary">
                                <Trans>source-available</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>transparency</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>budgeting</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>security</Trans>
                            </Badge>
                            <Badge variant="secondary">
                                <Trans>privacy</Trans>
                            </Badge>
                        </>
                    }
                />
            </BlogArticleHero>

            <BlogArticleContent>
                <BlogArticleSection>
                    <BlogArticleProse>
                        <Trans>
                            When you hand over your financial data to an app, you’re trusting it with some of the most sensitive information
                            about your life. Your spending patterns reveal where you live, where you work, what you eat, your health
                            conditions, your relationships, and countless other intimate details. Yet most people have no idea what happens
                            to this data once it enters their budget app.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            This is the black box problem of modern financial software. You input your transactions, and somewhere inside a
                            proprietary system, things happen. What things? You’ll never know. The code is locked away, the data flows are
                            hidden, and the company’s promises are the only thing standing between your financial life and potential misuse.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Open-source budgeting apps offer a fundamentally different approach. When the code is public, everything
                            changes. Security researchers can verify claims. Privacy advocates can audit data handling. And you, as a user,
                            can trust not because a company asks you to, but because the evidence is right there for anyone to examine.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>The Problem with Closed-Source Financial Software</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Most budget and expense tracking apps operate as black boxes. You download an app, create an account, link your
                            bank, and start tracking expenses. The interface is polished, the features are helpful, and everything seems
                            fine. But beneath that friendly surface lies a system you cannot inspect, verify, or truly understand.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>No Visibility into Data Handling</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            When you use a closed-source financial app, you have no way to verify what actually happens to your data. The
                            company might claim your information is encrypted, stored securely, and never shared. But how do you know? Their
                            privacy policy is a legal document written by lawyers, not a technical specification you can verify against
                            actual code.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>Consider what a typical budget app knows about you:</Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Every transaction you make, including amounts, merchants, and locations</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Your income patterns and sources</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Your bank account balances and account numbers</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Your spending categories and financial habits</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>When you’re paid and when you’re broke</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Your recurring subscriptions and financial commitments</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            This is an extraordinarily detailed financial portrait. With closed-source software, you’re trusting that
                            portrait to remain private based solely on corporate promises and legal agreements that can change at any time.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Hidden Telemetry and Tracking</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Many apps collect far more data than users realize. Analytics platforms, crash reporting services, advertising
                            SDKs, and third-party integrations often run silently in the background. Each of these systems may be collecting
                            and transmitting data about your usage patterns, device information, and potentially even your financial
                            activities.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>With closed-source apps, you cannot determine:</Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>What analytics services are embedded in the app</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>What data those services collect</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Where that data is transmitted</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Who has access to it</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>How long it’s retained</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Whether it’s ever sold or shared</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            The app might be sending your transaction data to a third-party analytics service for “product improvement.” It
                            might be fingerprinting your device and linking your financial behavior to advertising profiles. You would never
                            know, because you cannot see the code.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>No Way to Verify Security Claims</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Security through obscurity is a flawed concept that persists in closed-source software. Companies claim their
                            systems are secure, but security researchers cannot examine the code to verify those claims. Vulnerabilities may
                            exist for years before they’re discovered through a breach rather than through proactive auditing.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Closed-source financial apps often make security claims that sound impressive but are impossible to verify:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>“Bank-level encryption” (what does that actually mean in their implementation?)</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>“Your data is secure” (against what threat models? tested by whom?)</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>“We take security seriously” (how? show us the evidence)</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>Without access to the source code, these claims are marketing copy, not verifiable facts.</Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>What Open-Source Means for Security</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Open-source software inverts the traditional security model. Instead of hiding code and hoping nobody finds
                            vulnerabilities, open-source projects expose everything to scrutiny. This transparency creates a fundamentally
                            stronger security posture.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Community Auditing</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            When source code is public, anyone with the relevant expertise can examine it. Security researchers, privacy
                            advocates, concerned users, and professional auditors can all review the code for potential issues. This
                            distributed auditing creates multiple layers of oversight that closed-source companies simply cannot match.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>The open-source security community includes:</Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Academic researchers studying software security</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Professional penetration testers and security consultants</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Privacy-focused organizations and advocacy groups</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Hobbyist security researchers and bug hunters</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Other developers who need to understand the code</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            Each of these groups brings different perspectives, skills, and motivations. A privacy researcher might notice
                            data collection patterns that a security auditor overlooks. A developer integrating with the project might
                            discover edge cases the original authors missed. This diversity of attention is a strength no single security
                            team can replicate.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Faster Vulnerability Detection</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            When vulnerabilities are discovered in open-source software, the path from discovery to fix is typically faster
                            and more transparent than in closed-source alternatives. Security researchers can:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Discover a vulnerability by examining the code</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Report it through established channels (responsible disclosure)</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Potentially even submit a fix themselves</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Verify that the fix actually addresses the issue</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Confirm the fixed version is released</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            Compare this to closed-source software, where researchers often cannot even verify whether a vulnerability they
                            reported was actually fixed. They have to trust the vendor’s word, which history has shown is not always
                            reliable.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>No Security Through Obscurity</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            The security principle that open-source embraces is simple: assume your adversaries can see your code and design
                            security that works anyway. This leads to fundamentally stronger security architectures:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Encryption that doesn’t rely on hidden algorithms</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Authentication systems that remain secure even when examined</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Data handling that can withstand hostile scrutiny</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>No hidden backdoors that obscurity might otherwise conceal</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            When you cannot hide your implementation, you have to get it right. This pressure produces better security
                            outcomes than the false comfort of hidden code.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>How to Audit an Open-Source App (Even as a Non-Developer)</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            You don’t need to be a programmer to evaluate the trustworthiness of an open-source project. While you may not
                            be able to review code line by line, you can assess many important factors that indicate whether a project
                            deserves your trust.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Check the Issues and Discussions</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Every well-maintained open-source project has an issue tracker where bugs, feature requests, and concerns are
                            discussed. This is a goldmine of information about how the project operates:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <strong>
                            <Trans>What to look for:</Trans>
                        </strong>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>How do maintainers respond to security reports?</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Are user concerns addressed respectfully and thoroughly?</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Is there active discussion about privacy and data handling?</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Are there unresolved issues that concern you?</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>How quickly are critical bugs addressed?</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            A project that ignores security issues or dismisses user concerns is sending clear signals about its priorities.
                            Conversely, a project with thoughtful, timely responses to concerns demonstrates genuine commitment to its
                            users.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Look for Security Audits</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Professional security audits are a significant investment that demonstrates a project’s commitment to security.
                            Look for:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Published audit reports from recognized security firms</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Bug bounty programs that incentivize responsible disclosure</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Security-focused changelog entries showing proactive improvements</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>CVE (Common Vulnerabilities and Exposures) tracking and responses</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            The absence of professional audits isn’t necessarily disqualifying, especially for smaller projects. But for
                            apps handling sensitive financial data, some form of external security validation is reassuring.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Review Dependencies</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Modern software depends on many external libraries and frameworks. An app might have excellent code internally
                            while relying on problematic dependencies. You can evaluate dependency health by looking at:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Are dependencies regularly updated?</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Are there known vulnerabilities in dependencies?</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Are dependencies from reputable sources?</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Is the project using well-maintained libraries or abandoned ones?</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            Tools like GitHub’s dependency graph and security advisories make this information visible even to non-technical
                            users. A project with dozens of outdated dependencies and unaddressed security warnings should raise concerns.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Read the Privacy Policy vs. Actual Code</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            One of the most powerful aspects of open-source software is the ability to verify privacy claims against actual
                            implementation. While you may not be able to read code yourself, you can look for:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Does the project have clear documentation about data handling?</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Do privacy-focused community members discuss the implementation?</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Are there any concerning network requests documented in issues?</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Does the documentation match what others report about the code?</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            Communities around privacy-focused open-source software often include members who specifically audit data flows
                            and report their findings. Their analyses can help you understand what the code actually does.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Budgie’s Public Source Commitment</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Budgie is built on the principle that you shouldn’t have to trust us. You should be able to verify our claims,
                            examine our code, and confirm that we do what we say. Budgie&apos;s source is public, from the mobile app to the
                            backend services.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>What’s Public Source: Everything</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Unlike some projects that publish only portions of their code while keeping critical components proprietary,
                            Budgie keeps its product source public:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>The mobile application</strong> - The complete React Native codebase for iOS and Android
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>The backend services</strong> - All server-side code for optional features like bank sync
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>The landing page</strong> - Even our marketing website has public source
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>The build infrastructure</strong> - Our CI/CD pipelines and deployment configurations
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>The documentation</strong> - All guides, API docs, and technical specifications
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            This complete transparency means there are no hidden components where concerning behavior could hide. Every line
                            of code that touches your data is available for examination.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>License Choice and Why</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Budgie uses the O&apos;SAASY License, a source-available license that lets you read, modify, publish, and
                            distribute the code while reserving hosted-service monetization for the original project. We chose this license
                            for several reasons:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <strong>
                            <Trans>For users:</Trans>
                        </strong>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>You can verify the code without any legal concerns</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>You can modify the app for your own use</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>You can share your modifications with others</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>You’re not locked into any ecosystem or vendor</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <strong>
                            <Trans>For the community:</Trans>
                        </strong>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Developers can learn from our codebase</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Security researchers can audit without restrictions</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Other projects can build on our work</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>The ecosystem grows stronger through shared knowledge</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            We believe transparency depends on practical access to the source. If you cannot examine, modify, and contribute
                            to the code, the trust benefits are incomplete; if the project cannot sustain the official app, the product is
                            fragile.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>How to Contribute</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Public source thrives on community participation. If you want to contribute to Budgie, there are many ways to
                            get involved:
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <strong>
                            <Trans>For developers:</Trans>
                        </strong>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Fix bugs and submit pull requests</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Implement features from the roadmap</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Improve test coverage</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Enhance documentation</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <strong>
                            <Trans>For non-developers:</Trans>
                        </strong>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Report bugs and usability issues</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Suggest features and improvements</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Help with translations</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Spread the word about privacy-respecting alternatives</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <strong>
                            <Trans>For security researchers:</Trans>
                        </strong>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Audit the codebase for vulnerabilities</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Review our cryptographic implementations</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Test our data handling practices</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Report findings through responsible disclosure</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>Visit our GitHub repository to get started.</Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Community Contributions and Governance</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            An open-source project is more than just public code. It’s a community of users, contributors, and maintainers
                            working together toward shared goals. How that community is governed matters for the project’s long-term health
                            and trustworthiness.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>How Decisions Are Made</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>Budgie follows a transparent decision-making process:</Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <strong>
                            <Trans>Feature decisions:</Trans>
                        </strong>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Major features are discussed in public GitHub issues before implementation</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Community input is solicited and considered</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Decisions and rationales are documented publicly</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Controversial changes require broader consensus</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <strong>
                            <Trans>Security decisions:</Trans>
                        </strong>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Security-sensitive changes receive extra scrutiny</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>External input is welcomed on security architecture</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Breaking security changes are clearly communicated</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Responsible disclosure processes are followed</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <strong>
                            <Trans>Privacy decisions:</Trans>
                        </strong>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Any change affecting data handling is flagged for review</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Privacy implications are discussed openly</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>User consent and control remain primary considerations</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>The principle of minimal data collection guides all decisions</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleSubheading>
                        <Trans>Roadmap Transparency</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>Our development roadmap is public and regularly updated. You can see:</Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>What features are planned for upcoming releases</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>What’s currently being worked on</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>What trade-offs are being considered</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>How priorities are determined</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            This transparency lets you make informed decisions about whether Budgie is right for you. If a planned feature
                            concerns you, you can raise those concerns before it’s implemented. If a feature you need is missing, you can
                            advocate for it or contribute it yourself.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Bug Bounty and Security Disclosure</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>We take security vulnerabilities seriously and have established processes for responsible disclosure:</Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <strong>
                            <Trans>For security researchers:</Trans>
                        </strong>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Report vulnerabilities through our designated security channel</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Allow reasonable time for fixes before public disclosure</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Receive credit for discovered vulnerabilities (if desired)</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Coordinated disclosure to protect users</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <strong>
                            <Trans>Our commitments:</Trans>
                        </strong>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>Acknowledge receipt of security reports within 48 hours</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Provide regular updates on fix progress</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Credit researchers in security advisories</Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>Never take legal action against good-faith security research</Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            We believe that welcoming security research makes Budgie safer for everyone. Researchers who examine our code
                            are doing us and our users a service.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Other Open-Source Finance Tools to Consider</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Budgie isn’t the only open-source option for financial management. A healthy ecosystem of alternatives exists,
                            and we believe in acknowledging them fairly. Different tools suit different needs, and the best choice depends
                            on your specific requirements.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Actual Budget</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Actual is a privacy-focused budgeting tool with a strong local-first approach. It offers envelope budgeting
                            methodology, bank syncing capabilities, and both self-hosted and cloud options. If you prefer envelope-style
                            budgeting and want a desktop-focused experience, Actual is worth considering.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>Firefly III</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            Firefly III is a comprehensive personal finance manager designed for self-hosting. It offers detailed
                            transaction tracking, budgeting features, and extensive reporting. If you’re comfortable managing your own
                            server infrastructure and want maximum control, Firefly III provides powerful capabilities.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>GnuCash</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>
                            GnuCash is a veteran of open-source finance software, offering double-entry accounting suitable for personal and
                            small business use. If you need accounting-grade features like invoicing and business expense tracking,
                            GnuCash’s mature codebase has decades of development behind it.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleSubheading>
                        <Trans>How Budgie Differs</Trans>
                    </BlogArticleSubheading>

                    <BlogArticleProse>
                        <Trans>Budgie focuses specifically on mobile-first, offline-first expense tracking. Our priorities are:</Trans>
                    </BlogArticleProse>

                    <BlogArticleList>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Mobile-native experience</strong> - Built for phones, not adapted from desktop
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Offline-first architecture</strong> - Works without internet, syncs when available
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Privacy by design</strong> - Your data stays on your device by default
                            </Trans>
                        </BlogArticleListItem>
                        <BlogArticleListItem>
                            <Trans>
                                <strong>Modern user experience</strong> - Clean, intuitive interface for daily tracking
                            </Trans>
                        </BlogArticleListItem>
                    </BlogArticleList>

                    <BlogArticleProse>
                        <Trans>
                            We think there’s room in the ecosystem for all these tools. Users benefit when they have choices, and
                            competition among open-source projects drives innovation while maintaining the trust benefits of transparency.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Frequently Asked Questions</Trans>
                    </BlogArticleHeading>

                    <BlogFaqSection>
                        <BlogFaqItem question={<Trans>Is open-source software really more secure than proprietary software?</Trans>}>
                            <Trans>
                                Open-source software isn’t automatically more secure, but it enables better security through transparency.
                                When code is public, security flaws can be found and fixed by anyone with the expertise, not just the
                                original developers. This distributed scrutiny typically catches problems faster than relying solely on
                                internal security teams. However, the security benefits only materialize when the community actually reviews
                                the code, so active, well-maintained projects are more likely to be secure than abandoned ones.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>If the code is public, can’t hackers use it to find vulnerabilities?</Trans>}>
                            <Trans>
                                This is a common concern, but security research consistently shows that obscurity provides weak protection.
                                Determined attackers can reverse-engineer closed-source applications, find vulnerabilities through fuzzing
                                and probing, or exploit the same bugs that internal developers missed. Meanwhile, legitimate security
                                researchers are blocked from helping. Open source assumes adversaries will study the code and designs
                                security that works anyway. This produces more robust systems than hoping attackers won’t look too closely.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>How do I know the app I download matches the public source code?</Trans>}>
                            <Trans>
                                This is a valid concern known as “build verification.” Budgie uses reproducible builds where possible,
                                allowing anyone to verify that the published app matches the source code. For mobile apps, additional trust
                                is required in the app store distribution, but the public source code ensures you can build the app yourself
                                if you want maximum verification. We also provide checksums for releases so you can verify download
                                integrity.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>What if the project is abandoned? Will I lose access to my data?</Trans>}>
                            <Trans>
                                One of the key benefits of public-source and offline-first architecture is data sovereignty. Your data is
                                stored locally on your device, not locked in some company’s cloud that might disappear. If Budgie
                                development stopped tomorrow, your data would still be on your phone, and the public source code would allow
                                anyone to continue development or create export tools. You’re never locked in.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>Does public source mean anyone can change my app without my knowledge?</Trans>}>
                            <Trans>
                                No. While anyone can propose changes to the code, you control which version you run. Updates only install
                                when you choose to update the app. If you’re concerned about a particular version, you can review the
                                changes before updating or even build your own version from source. The open nature of the code means
                                changes are visible and reviewable, actually giving you more control rather than less.
                            </Trans>
                        </BlogFaqItem>

                        <BlogFaqItem question={<Trans>How does Budgie make money if the software is free?</Trans>}>
                            <Trans>
                                Budgie is free to use with optional premium features for users who want additional capabilities. Our
                                business model relies on users who find enough value in the product to support its development, not on
                                monetizing user data. The public-source model actually supports this because users can trust their data
                                isn’t being sold, making them more willing to pay for premium features. Transparency and sustainable
                                business can coexist.
                            </Trans>
                        </BlogFaqItem>
                    </BlogFaqSection>
                </BlogArticleSection>

                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Take the Transparent Path Forward</Trans>
                    </BlogArticleHeading>

                    <BlogArticleProse>
                        <Trans>
                            Financial software that respects your privacy shouldn’t require blind faith. When you choose a public-source
                            budget app, you’re choosing verifiable security over marketing promises. You’re choosing community oversight
                            over corporate opacity. You’re choosing to trust evidence rather than assertions.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Budgie embodies this transparent approach. Every line of code is public. Every decision is documented. Every
                            claim is verifiable. We don’t ask you to trust us because we say so. We ask you to trust us because you can see
                            exactly what we do.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Your financial data deserves this level of transparency. The patterns in your spending reveal intimate details
                            about your life, and you have every right to know exactly how that information is handled. Public-source
                            budgeting makes that knowledge possible.
                        </Trans>
                    </BlogArticleProse>

                    <BlogArticleProse>
                        <Trans>
                            Ready to experience financial tracking built on transparency? Explore our public source code, learn about our
                            security practices, and join the waitlist to be among the first to use Budgie. Your money. Your data. Your
                            ability to verify every claim we make.
                        </Trans>
                    </BlogArticleProse>
                </BlogArticleSection>
            </BlogArticleContent>

            <RelatedArticles locale={lang} slugs={RELATED_SLUGS} />

            <FeaturePageRelated features={relatedFeatures} locale={lang} />

            <BlogArticleCta locale={lang} />
        </main>
    );
}
