import { useLingui } from '@lingui/react/macro';

import { ChartLegend } from '../../../@generic/component/chart-legend/chart-legend';

export const RunwayForecastLegend = () => {
    const { t } = useLingui();

    const items = [
        { label: t`Most likely`, swatchClassName: 'h-0.5 w-4 rounded-full bg-primary' },
        { label: t`Better and worse months`, swatchClassName: 'h-2 w-4 rounded-xxs bg-primary/10' },
        { label: t`Runs out`, swatchClassName: 'h-2 w-2 rounded-full bg-destructive-foreground' }
    ];

    return <ChartLegend items={items} />;
};
