import { AiSection } from '../../components/ai-section/ai-section';
import { BanksSection } from '../../components/banks-section/banks-section';
import { BlogSection } from '../../components/blog-section/blog-section';
import { CtaSection } from '../../components/cta-section/cta-section';
import { FaqSection } from '../../components/faq-section/faq-section';
import { FeaturesSection } from '../../components/features-section/features-section';
import { Footer } from '../../components/footer/footer';
import { Header } from '../../components/header/header';
import { HeroSection } from '../../components/hero-section/hero-section';
import { HowItWorksSection } from '../../components/how-it-works-section/how-it-works-section';
import { TestimonialsSection } from '../../components/testimonials-section/testimonials-section';
import { WhitelistSection } from '../../components/whitelist-section/whitelist-section';
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
