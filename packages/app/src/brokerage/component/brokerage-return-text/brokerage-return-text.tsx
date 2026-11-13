import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatGainPercent } from '../../../i18n/hook/use-format-gain-percent.hook';

interface Props {
    readonly gain: number;
    readonly percent: number | null;
    readonly instrumentSymbol: string;
}

const TONE_BY_DIRECTION: Record<number, string> = {
    [-1]: 'text-destructive-foreground',
    0: 'text-secondary-foreground',
    1: 'text-positive-foreground'
};

export const BrokerageReturnText = ({ gain, percent, instrumentSymbol }: Props) => {
    const formatDigits = useDisplayFormatDigits();
    const formatPercent = useFormatGainPercent();

    const direction = Math.sign(Math.round(gain * 100));
    const sign = ['−', '', '+'][direction + 1];
    const label = [formatDigits(Math.abs(gain), instrumentSymbol), isDefined(percent) ? formatPercent(percent) : null]
        .filter(isDefined)
        .map(part => `${sign}${part}`)
        .join(' · ');

    return (
        <ProtectedText
            numberOfLines={1}
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
            className={cn('text-[13px] font-medium tabular-nums', TONE_BY_DIRECTION[direction])}
        >
            {label}
        </ProtectedText>
    );
};
