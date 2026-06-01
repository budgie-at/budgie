import { Trans } from '@lingui/react/macro';
import { Filter } from 'lucide-react';

import { Badge } from '../../../ui/badge';

export const AnalyticsSectionChartHeader = () => (
    <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold">
            <Trans>This Month&apos;s Reality Check</Trans>
        </h4>

        <Badge variant="outline">
            <Filter className="size-3 mr-1" />
            <Trans>January 2025</Trans>
        </Badge>
    </div>
);
