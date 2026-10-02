import { HeroSectionHeader } from './hero-section-header';
import { HeroSectionImage } from './hero-section-image';

interface Props {
    locale: string;
}

export const HeroSection = ({ locale }: Props) => (
    <section className="hero-section">
        <div aria-hidden="true" className="hero-backdrop" />

        <div className="container hero-grid px-4 md:px-6">
            <HeroSectionHeader />
            <HeroSectionImage locale={locale} />
        </div>
    </section>
);
