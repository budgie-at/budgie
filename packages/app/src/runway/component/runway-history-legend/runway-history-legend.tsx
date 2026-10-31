import { useLingui } from '@lingui/react/macro';

import { ChartLegend } from '../../../@generic/component/chart-legend/chart-legend';
import { useRunwayAmountLabel } from '../../hook/use-runway-amount-label.hook';

interface Props {
    readonly hasSpike: boolean;
    readonly typicalAmount: number;
}

export const RunwayHistoryLegend = ({ hasSpike, typicalAmount }: Props) => {
    const { t } = useLingui();
    const formatAmount = useRunwayAmountLabel();

    const amount = formatAmount(typicalAmount);
    const items = [
        { label: t`Money out`, swatchClassName: 'h-2 w-2 rounded-xxs bg-primary' },
        { label: t`Money in`, swatchClassName: 'h-2 w-2 rounded-xxs bg-primary/35' },
        ...(hasSpike ? [{ label: t`One-off spike`, swatchClassName: 'h-2 w-2 rounded-xxs bg-warning-fill' }] : []),
        { label: t`Typical month ${amount}`, swatchClassName: 'h-px w-4 rounded-full bg-primary/50' }
    ];

    return <ChartLegend items={items} />;
};
