import { ComparisonSectionHeader } from './comparison-section-header';
import { ComparisonTable } from './comparison-table';

export const ComparisonSection = () => (
    <section className="w-full py-20 md:py-28" id="comparison">
        <div className="container px-4 md:px-6">
            <ComparisonSectionHeader />
            <ComparisonTable />
        </div>
    </section>
);
