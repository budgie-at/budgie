import { IntegrationsSectionCards } from './integrations-section-cards';
import { IntegrationsSectionCta } from './integrations-section-cta';
import { IntegrationsSectionFeatures } from './integrations-section-features';
import { IntegrationsSectionHeader } from './integrations-section-header';

export const IntegrationsSection = () => (
    <section className="w-full py-20 md:py-32" id="integrations">
        <div className="container px-4 md:px-6">
            <IntegrationsSectionHeader />
            <IntegrationsSectionCards />
            <IntegrationsSectionFeatures />
            <IntegrationsSectionCta />
        </div>
    </section>
);
