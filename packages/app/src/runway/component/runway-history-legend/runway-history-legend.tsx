import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { ChartLegend } from '../../../@generic/component/chart-legend/chart-legend';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly hasSpike: boolean;
    readonly typicalAmount: number;
}

export const RunwayHistoryLegend = ({ hasSpike, typicalAmount }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useFormatDigits(0);

    const amount = formatDigits(convertFromMicroUnits(typicalAmount), defaultInstrument.symbol);
    const items = [
        { label: t`Money out`, swatchClassName: 'h-2 w-2 rounded-xxs bg-primary' },
        { label: t`Money in`, swatchClassName: 'h-2 w-2 rounded-xxs bg-primary/35' },
        ...(hasSpike ? [{ label: t`One-off spike`, swatchClassName: 'h-2 w-2 rounded-xxs bg-warning-fill' }] : []),
        { label: t`typical month ${amount}`, swatchClassName: 'h-px w-4 rounded-full bg-primary/35' }
    ];

    return <ChartLegend items={items} />;
};
