import { Trans } from '@lingui/react/macro';

import { AnalyticsSectionBar } from './analytics-section-bar';

export const AnalyticsSectionChartBars = () => (
    <div className="space-y-3">
        <AnalyticsSectionBar color="bg-blue-500" label={<Trans>Housing</Trans>} value="$1,200 (37%)" width="37%" />
        <AnalyticsSectionBar
            color="bg-orange-500"
            hasWarning
            label={<Trans>Food &amp; Dining</Trans>}
            value="$680 (21%)"
            warningColor="text-orange-500"
            width="21%"
        />
        <AnalyticsSectionBar color="bg-green-500" label={<Trans>Transportation</Trans>} value="$420 (13%)" width="13%" />
        <AnalyticsSectionBar
            color="bg-red-500"
            hasWarning
            label={<Trans>Subscriptions</Trans>}
            value="$340 (10%)"
            warningColor="text-red-500"
            width="10%"
        />
        <AnalyticsSectionBar color="bg-gray-500" label={<Trans>Other</Trans>} value="$600 (19%)" width="19%" />
    </div>
);
