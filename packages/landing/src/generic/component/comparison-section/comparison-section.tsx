import { ComparisonSectionHeader } from './comparison-section-header';
import { ComparisonTable } from './comparison-table';

export const ComparisonSection = () => (
    <section className="w-full py-8 md:py-20" id="comparison">
        <div className="container section-split">
            <ComparisonSectionHeader />
            <ComparisonTable />
        </div>
    </section>
);
