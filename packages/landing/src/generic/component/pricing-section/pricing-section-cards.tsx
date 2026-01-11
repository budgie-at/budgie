import { PricingSectionCardAnnual } from './pricing-section-card-annual';
import { PricingSectionCardMonthly } from './pricing-section-card-monthly';
import { PricingSectionCardTrial } from './pricing-section-card-trial';

export const PricingSectionCards = () => (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <PricingSectionCardTrial />
        <PricingSectionCardAnnual />
        <PricingSectionCardMonthly />
    </div>
);
