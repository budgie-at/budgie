import { ComparisonSectionHeader } from './comparison-section-header';
import { ComparisonTable } from './comparison-table';

export const ComparisonSection = () => (
    <section className="w-full py-16 md:py-24" id="comparison">
        <div className="container px-4 md:px-6 max-w-7xl">
            <ComparisonSectionHeader />
            <ComparisonTable />
        </div>
    </section>
);
