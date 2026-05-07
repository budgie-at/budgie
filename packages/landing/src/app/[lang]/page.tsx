import { msg } from '@lingui/core/macro';

import { AiSection } from '../../generic/component/ai-section/ai-section';
import { AnalyticsSection } from '../../generic/component/analytics-section/analytics-section';
import { BlogSection } from '../../generic/component/blog-section/blog-section';
import { ComparisonSection } from '../../generic/component/comparison-section/comparison-section';
import { CtaSection } from '../../generic/component/cta-section/cta-section';
import { DebtSection } from '../../generic/component/debt-section/debt-section';
import { FaqSection } from '../../generic/component/faq-section/faq-section';
import { FeaturesSection } from '../../generic/component/features-section/features-section';
import { HeroSection } from '../../generic/component/hero-section/hero-section';
import { HowItWorksSection } from '../../generic/component/how-it-works-section/how-it-works-section';
import { IntegrationsSection } from '../../generic/component/integrations-section/integrations-section';
import { JsonLd } from '../../generic/component/json-ld/json-ld';
import { OpenSourceSection } from '../../generic/component/open-source-section/open-source-section';
import { ProblemSolutionSection } from '../../generic/component/problem-solution-section/problem-solution-section';
import { SecuritySection } from '../../generic/component/security-section/security-section';
import { TestimonialsSection } from '../../generic/component/testimonials-section/testimonials-section';
import { TrustBanner } from '../../generic/component/trust-banner/trust-banner';
import { UspPillarsSection } from '../../generic/component/usp-pillars-section/usp-pillars-section';
import { buildLandingJsonLd } from '../../generic/util/build-landing-json-ld.util';
import { getI18nInstance } from '../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../i18n/init-lingui';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return {
        title: { absolute: i18n._(msg`Budgie - Privacy-First Expense Tracker`) }
    };
}

export default async function LandingPage(props: PageLangParam) {
    const { lang } = await props.params;

    initLingui(lang);

    const i18n = getI18nInstance(lang);
    const { softwareApplication, faqPage } = buildLandingJsonLd(i18n);

    return (
        <main className="flex-1">
            <JsonLd data={softwareApplication} />
            <JsonLd data={faqPage} />

            {/* Hero + Trust */}
            <HeroSection />
            <TrustBanner />

            {/* Problem & Solution */}
            <ProblemSolutionSection />
            <UspPillarsSection locale={lang} />

            {/* Features & How It Works */}
            <FeaturesSection locale={lang} />
            <HowItWorksSection />

            {/* Security Deep-Dive */}
            <SecuritySection />
            <ComparisonSection />

            {/* Feature Showcases */}
            <AnalyticsSection />
            <AiSection />
            <DebtSection />
            <IntegrationsSection />

            {/* Social Proof */}
            <TestimonialsSection />

            {/* Trust */}
            <OpenSourceSection />

            {/* FAQ & Resources */}
            <FaqSection />
            <BlogSection locale={lang} />

            {/* Final Conversion */}
            <CtaSection />
        </main>
    );
}
