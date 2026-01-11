import { Trans } from '@lingui/react/macro';
import { TrendingDown, TrendingUp } from 'lucide-react';

export const AnalyticsSectionChartStats = () => (
    <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30">
            <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="size-4 text-green-600" />

                <span className="text-sm text-green-600 dark:text-green-400">
                    <Trans>Income</Trans>
                </span>
            </div>

            <p className="text-2xl font-bold text-green-700 dark:text-green-300">$8,450</p>
        </div>

        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30">
            <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="size-4 text-red-600" />

                <span className="text-sm text-red-600 dark:text-red-400">
                    <Trans>Spending</Trans>
                </span>
            </div>

            <p className="text-2xl font-bold text-red-700 dark:text-red-300">$3,240</p>
        </div>
    </div>
);
