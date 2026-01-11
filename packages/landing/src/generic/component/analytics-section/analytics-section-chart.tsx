import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';
import { Motion } from '../motion/motion';

import { AnalyticsSectionChartBars } from './analytics-section-chart-bars';
import { AnalyticsSectionChartCards } from './analytics-section-chart-cards';
import { AnalyticsSectionChartHeader } from './analytics-section-chart-header';
import { AnalyticsSectionChartStats } from './analytics-section-chart-stats';

const viewportOnce = { once: true };
const rightColumnInitial = { opacity: 0, x: 20 };
const rightColumnAnimate = { opacity: 1, x: 0 };
const rightColumnTransition = { duration: 0.5, delay: 0.2 };

export const AnalyticsSectionChart = () => (
    <Motion
        className="relative"
        initial={rightColumnInitial}
        transition={rightColumnTransition}
        viewport={viewportOnce}
        whileInView={rightColumnAnimate}
    >
        <div className="grid gap-4">
            <Card className="border-border/40 bg-background/80 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6">
                    <AnalyticsSectionChartHeader />
                    <AnalyticsSectionChartStats />
                    <AnalyticsSectionChartBars />
                </CardContent>
            </Card>

            <AnalyticsSectionChartCards />
        </div>
    </Motion>
);
