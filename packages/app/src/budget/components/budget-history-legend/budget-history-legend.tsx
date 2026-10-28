import { useLingui } from '@lingui/react/macro';

import { ChartLegend } from '../../../@generic/component/chart-legend/chart-legend';

export const BudgetHistoryLegend = () => {
    const { t } = useLingui();

    const items = [
        { label: t`Under limit`, swatchClassName: 'h-2 w-2 rounded-xxs bg-positive-foreground' },
        { label: t`Over`, swatchClassName: 'h-2 w-2 rounded-xxs bg-destructive-foreground' },
        { label: t`Limit`, swatchClassName: 'h-0.5 w-4 rounded-full bg-primary' }
    ];

    return <ChartLegend items={items} />;
};
