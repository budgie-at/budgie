import { useLingui } from '@lingui/react/macro';

import { ChartLegend } from '../../../@generic/component/chart-legend/chart-legend';

export const RunwayHistoryLegend = () => {
    const { t } = useLingui();

    const items = [
        { label: t`Expenses`, swatchClassName: 'h-2 w-2 rounded-xxs bg-primary' },
        { label: t`Income`, swatchClassName: 'h-2 w-2 rounded-xxs bg-primary/45' },
        { label: t`Typical month`, swatchClassName: 'h-px w-4 rounded-full bg-primary/60' }
    ];

    return <ChartLegend items={items} />;
};
