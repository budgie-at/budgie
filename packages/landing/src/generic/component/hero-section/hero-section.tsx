import { HeroSectionBadges } from './hero-section-badges';
import { HeroSectionHeader } from './hero-section-header';
import { HeroSectionImage } from './hero-section-image';

export const HeroSection = () => (
    <section className="w-full py-20 md:py-32 lg:py-40 overflow-hidden">
        <div className="container py-6 px-4 md:px-6 relative">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

            <HeroSectionHeader />
            <HeroSectionImage />
            <HeroSectionBadges />
        </div>
    </section>
);
