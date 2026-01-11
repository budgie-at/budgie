import { useLingui } from '@lingui/react/macro';

import { AnalyticsSectionBar } from './analytics-section-bar';

export const AnalyticsSectionChartBars = () => {
    const { t } = useLingui();

    return (
        <div className="space-y-3">
            <AnalyticsSectionBar color="bg-blue-500" label={t`Housing`} value="$1,200 (37%)" width="37%" />
            <AnalyticsSectionBar
                color="bg-orange-500"
                hasWarning
                label={t`Food & Dining`}
                value="$680 (21%)"
                warningColor="text-orange-500"
                width="21%"
            />
            <AnalyticsSectionBar color="bg-green-500" label={t`Transportation`} value="$420 (13%)" width="13%" />
            <AnalyticsSectionBar
                color="bg-red-500"
                hasWarning
                label={t`Subscriptions`}
                value="$340 (10%)"
                warningColor="text-red-500"
                width="10%"
            />
            <AnalyticsSectionBar color="bg-gray-500" label={t`Other`} value="$600 (19%)" width="19%" />
        </div>
    );
};
