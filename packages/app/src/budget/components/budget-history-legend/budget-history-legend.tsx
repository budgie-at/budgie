import { useLingui } from '@lingui/react/macro';

import { ChartLegend } from '../../../@generic/component/chart-legend/chart-legend';

import type { BudgetHistoryBarInterface } from '../../interface/budget-history-bar.interface';

interface Props {
    readonly bars: readonly BudgetHistoryBarInterface[];
}

export const BudgetHistoryLegend = ({ bars }: Props) => {
    const { t } = useLingui();
    const underItems = bars.some(bar => bar.spent <= bar.limit)
        ? [{ label: t`Under limit`, swatchClassName: 'h-2 w-2 rounded-xxs bg-primary' }]
        : [];
    const overItems = bars.some(bar => bar.spent > bar.limit)
        ? [{ label: t`Over`, swatchClassName: 'h-2 w-2 rounded-xxs bg-destructive-fill' }]
        : [];
    const limitItems = [{ label: t`Limit`, swatchClassName: 'h-0.5 w-4 rounded-full bg-primary' }];

    const items = [...underItems, ...overItems, ...limitItems];

    return <ChartLegend items={items} />;
};
