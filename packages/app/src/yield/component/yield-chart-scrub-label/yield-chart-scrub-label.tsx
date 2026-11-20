import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text } from 'react-native';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';

import type { YieldBucketInterface, YieldBucketUnitEnum } from '@budgie/market';

interface Props {
    readonly bucket: Pick<YieldBucketInterface, 'start'>;
    readonly unit: YieldBucketUnitEnum;
    readonly amount: number;
    readonly x: number;
    readonly plotWidth: number;
}

const LABEL_WIDTH = 160;
const HALF = 2;

export const YieldChartScrubLabel = ({ bucket, unit, amount, x, plotWidth }: Props) => {
    const { formatTick } = useYieldDateLabels();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const centred = x - LABEL_WIDTH / HALF;
    const maxLeft = Math.max(plotWidth - LABEL_WIDTH, 0);
    const isStart = centred < 0;
    const isEnd = centred > maxLeft;
    const style = { left: Math.min(Math.max(centred, 0), maxLeft), top: 0 };
    const alignClassName = cn(isStart && 'text-left', isEnd && 'text-right', !isStart && !isEnd && 'text-center');

    return (
        <Text
            pointerEvents="none"
            numberOfLines={1}
            maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
            className={cn('absolute w-[160px] text-[12px] font-semibold leading-[16px] tabular-nums text-primary', alignClassName)}
            style={style}
        >
            {`${formatTick(bucket, unit, true)} · ${formatAmount(amount, symbol)}`}
        </Text>
    );
};
