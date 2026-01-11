import { PricingSectionCards } from './pricing-section-cards';
import { PricingSectionCta } from './pricing-section-cta';
import { PricingSectionHeader } from './pricing-section-header';

export const PricingSection = () => (
    <section className="w-full py-20 md:py-32 bg-muted/30" id="pricing">
        <div className="container px-4 md:px-6">
            <PricingSectionHeader />
            <PricingSectionCards />
            <PricingSectionCta />
        </div>
    </section>
);
