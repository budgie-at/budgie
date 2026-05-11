import { FeaturesSectionGrid } from './features-section-grid';
import { FeaturesSectionHeader } from './features-section-header';

interface Props {
    readonly locale: string;
}

export const FeaturesSection = ({ locale }: Props) => (
    <section className="w-full py-20 md:py-32" id="features">
        <div className="container px-4 md:px-6">
            <FeaturesSectionHeader />
            <FeaturesSectionGrid locale={locale} />
        </div>
    </section>
);
