import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text } from 'react-native';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { THOUSAND } from '../../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../../i18n/hook/use-format-compact-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

import type { YieldAxisInterface } from '../../interface/yield-axis.interface';
import type { YieldBarLayoutInterface } from '../../interface/yield-bar-layout.interface';

interface Props {
    readonly totals: readonly number[];
    readonly layout: YieldBarLayoutInterface;
    readonly axis: YieldAxisInterface;
}

const PEAK_LABEL_OFFSET = 16;

export const YieldChartPeakLabel = ({ totals, layout, axis }: Props) => {
    const isAmountProtected = useIsAmountProtected();
    const formatCompact = useFormatCompactDigits(THOUSAND);
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const peakTotal = Math.max(0, ...totals);

    if (peakTotal <= 0) {
        return null;
    }

    const peakIndex = totals.indexOf(peakTotal);
    const peakLabel = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatCompact(peakTotal, symbol);
    const peakStyle = {
        left: (layout.xs.at(peakIndex) ?? 0) - layout.barWidth,
        top: Math.max(layout.zeroY - (peakTotal / axis.top) * layout.zeroY - PEAK_LABEL_OFFSET, 0)
    };

    return (
        <Text pointerEvents="none" className="absolute text-[11px] font-medium tabular-nums text-secondary-foreground" style={peakStyle}>
            {peakLabel}
        </Text>
    );
};
