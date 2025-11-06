import { AiSection } from '../../generic/component/ai-section/ai-section';
import { BanksSection } from '../../generic/component/banks-section/banks-section';
import { BlogSection } from '../../generic/component/blog-section/blog-section';
import { CtaSection } from '../../generic/component/cta-section/cta-section';
import { FaqSection } from '../../generic/component/faq-section/faq-section';
import { FeaturesSection } from '../../generic/component/features-section/features-section';
import { Footer } from '../../generic/component/footer/footer';
import { Header } from '../../generic/component/header/header';
import { HeroSection } from '../../generic/component/hero-section/hero-section';
import { HowItWorksSection } from '../../generic/component/how-it-works-section/how-it-works-section';
import { TestimonialsSection } from '../../generic/component/testimonials-section/testimonials-section';
import { WhitelistSection } from '../../generic/component/whitelist-section/whitelist-section';
import { PageLangParam, initLingui } from '../../i18n/init-lingui';

export default async function LandingPage(props: PageLangParam) {
    const { lang } = await props.params;

    initLingui(lang);

    return (
        <div className="flex min-h-dvh flex-col">
            <Header />

            <main className="flex-1">
                <HeroSection />
                <BanksSection />
                <FeaturesSection />
                <HowItWorksSection />
                <AiSection />
                <TestimonialsSection />
                <BlogSection locale={lang} />
                <WhitelistSection />
                <FaqSection />
                <CtaSection />
            </main>

            <Footer />
        </div>
    );
}
