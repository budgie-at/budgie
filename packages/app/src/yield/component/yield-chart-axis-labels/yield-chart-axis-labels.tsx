import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text } from 'react-native';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { THOUSAND } from '../../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../../i18n/hook/use-format-compact-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YIELD_AXIS_GUTTER } from '../../constant/yield-axis-gutter.constant';

import type { YieldAxisInterface } from '../../interface/yield-axis.interface';

interface Props {
    readonly axis: YieldAxisInterface;
    readonly width: number;
    readonly height: number;
}

const LABEL_HEIGHT = 14;
const AXIS_MAX_FONT_SIZE_MULTIPLIER = 1.3;
const HALF = 2;
const ZERO_LABEL = '0';

export const YieldChartAxisLabels = ({ axis, width, height }: Props) => {
    const isAmountProtected = useIsAmountProtected();
    const formatCompact = useFormatCompactDigits(THOUSAND);
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const zeroY = (axis.top * height) / (axis.top - axis.bottom);
    const format = (value: number) => (isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatCompact(value, symbol));
    const labels = [
        { key: 'top', y: 0, text: format(axis.top) },
        { key: 'mid', y: zeroY / HALF, text: format(axis.top / HALF) },
        { key: 'zero', y: zeroY, text: ZERO_LABEL },
        ...(axis.bottom < 0 ? [{ key: 'bottom', y: height, text: `−${format(-axis.bottom)}` }] : [])
    ].map(({ key, y, text }) => ({
        key,
        text,
        style: { left: width, width: YIELD_AXIS_GUTTER, top: Math.min(Math.max(y - LABEL_HEIGHT / HALF, 0), height - LABEL_HEIGHT) }
    }));

    return (
        <>
            {labels.map(({ key, text, style }) => (
                <Text
                    key={key}
                    pointerEvents="none"
                    numberOfLines={1}
                    maxFontSizeMultiplier={AXIS_MAX_FONT_SIZE_MULTIPLIER}
                    className="absolute text-right text-[11px] leading-[14px] tabular-nums text-secondary-foreground"
                    style={style}
                >
                    {text}
                </Text>
            ))}
        </>
    );
};
