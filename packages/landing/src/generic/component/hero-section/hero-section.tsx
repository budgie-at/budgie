import { HeroSectionHeader } from './hero-section-header';
import { HeroSectionImage } from './hero-section-image';

interface Props {
    locale: string;
}

export const HeroSection = ({ locale }: Props) => (
    <section className="hero-section">
        <div aria-hidden="true" className="hero-backdrop" />

        <div className="container hero-grid">
            <HeroSectionHeader />
            <HeroSectionImage locale={locale} />
        </div>
    </section>
);
