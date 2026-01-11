import { AnalyticsSectionChart } from './analytics-section-chart';
import { AnalyticsSectionContent } from './analytics-section-content';

export const AnalyticsSection = () => (
    <section className="w-full py-20 md:py-32" id="analytics">
        <div className="container px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <AnalyticsSectionContent />
                <AnalyticsSectionChart />
            </div>
        </div>
    </section>
);
