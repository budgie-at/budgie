import { AiSection } from '../components/ai-section/ai-section';
import { BanksSection } from '../components/banks-section/banks-section';
import { CtaSection } from '../components/cta-section/cta-section';
import { FaqSection } from '../components/faq-section/faq-section';
import { FeaturesSection } from '../components/features-section/features-section';
import { Footer } from '../components/footer/footer';
import { Header } from '../components/header/header';
import { HeroSection } from '../components/hero-section/hero-section';
import { HowItWorksSection } from '../components/how-it-works-section/how-it-works-section';
import { TestimonialsSection } from '../components/testimonials-section/testimonials-section';
import { WhitelistSection } from '../components/whitelist-section/whitelist-section';

export default function LandingPage() {
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
                <WhitelistSection />
                <FaqSection />
                <CtaSection />
            </main>

            <Footer />
        </div>
    );
}
