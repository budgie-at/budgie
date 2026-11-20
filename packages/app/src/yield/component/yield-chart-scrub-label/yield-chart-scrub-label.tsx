import { YieldRangeEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import { use, useState } from 'react';
import { Text } from 'react-native';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { clampYieldLabelLeft } from '../../utils/clamp-yield-label-left.util';

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly end: string;
    readonly amount: number;
    readonly priorAmount: number;
    readonly x: number;
    readonly plotWidth: number;
}

const LABEL_TOP = 0;
const ESTIMATED_WIDTH = 220;

export const YieldChartScrubLabel = ({ end, amount, priorAmount, x, plotWidth }: Props) => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const { formatMonthAndDay } = useFormatDate();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const [measuredWidth, setMeasuredWidth] = useState(ESTIMATED_WIDTH);

    const style = { left: clampYieldLabelLeft(x, measuredWidth, 0, plotWidth), top: LABEL_TOP };
    const priorLabel = screenKey.key.range === YieldRangeEnum.YEAR ? t`Prior year` : t`Prior period`;
    const current = `${formatMonthAndDay(parseISO(end))} · ${formatAmount(amount, symbol)}`;
    const prior = `${priorLabel} ${formatAmount(priorAmount, symbol)}`;

    const handleLayout = (event: LayoutChangeEvent) => void setMeasuredWidth(event.nativeEvent.layout.width);

    return (
        <Text
            pointerEvents="none"
            numberOfLines={1}
            maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
            className="absolute text-[13px] font-semibold leading-[16px] tabular-nums text-primary"
            style={style}
            onLayout={handleLayout}
        >
            {current}
            <Text className="text-secondary-foreground">{`  ${prior}`}</Text>
        </Text>
    );
};
