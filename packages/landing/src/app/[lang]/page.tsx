import { AiSection } from '../../generic/component/ai-section/ai-section';
import { AnalyticsSection } from '../../generic/component/analytics-section/analytics-section';
import { BlogSection } from '../../generic/component/blog-section/blog-section';
import { CtaSection } from '../../generic/component/cta-section/cta-section';
import { DebtSection } from '../../generic/component/debt-section/debt-section';
import { FaqSection } from '../../generic/component/faq-section/faq-section';
import { FeaturesSection } from '../../generic/component/features-section/features-section';
import { HeroSection } from '../../generic/component/hero-section/hero-section';
import { HowItWorksSection } from '../../generic/component/how-it-works-section/how-it-works-section';
import { IntegrationsSection } from '../../generic/component/integrations-section/integrations-section';
import { PricingSection } from '../../generic/component/pricing-section/pricing-section';
import { SecuritySection } from '../../generic/component/security-section/security-section';
import { TestimonialsSection } from '../../generic/component/testimonials-section/testimonials-section';
import { WhitelistSection } from '../../generic/component/whitelist-section/whitelist-section';
import { PageLangParam, initLingui } from '../../i18n/init-lingui';

export default async function LandingPage(props: PageLangParam) {
    const { lang } = await props.params;

    initLingui(lang);

    return (
        <main className="flex-1">
            <HeroSection />
            <FeaturesSection />
            <AnalyticsSection />
            <SecuritySection />
            <IntegrationsSection />
            <HowItWorksSection />
            <AiSection />
            <DebtSection />
            <PricingSection />
            <TestimonialsSection />
            <BlogSection locale={lang} />
            <WhitelistSection />
            <FaqSection />
            <CtaSection />
        </main>
    );
}
