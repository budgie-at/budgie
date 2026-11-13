import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatGainPercent } from '../../../i18n/hook/use-format-gain-percent.hook';
import { getMarketMoveClassName } from '../../../market-data/utils/get-market-move-class-name.util';

interface Props {
    readonly gain: number;
    readonly percent: number | null;
    readonly instrumentSymbol: string;
    readonly className?: string;
    readonly testID?: string;
}

const ARROW_BY_DIRECTION: Record<number, string> = { [-1]: '▼ ', 0: '', 1: '▲ ' };

export const BrokerageReturnText = ({ gain, percent, instrumentSymbol, className, testID }: Props) => {
    const formatDigits = useDisplayFormatDigits();
    const formatPercent = useFormatGainPercent();
    const isAccessibilityTextSize = useIsAccessibilityTextSize();

    const direction = Math.sign(Math.round(gain * 100));
    const label = [formatDigits(Math.abs(gain), instrumentSymbol), isDefined(percent) ? formatPercent(percent) : null]
        .filter(isDefined)
        .join(' · ');
    const lineCount = isAccessibilityTextSize ? 0 : 1;

    return (
        <ProtectedText
            numberOfLines={lineCount}
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
            className={cn(
                'text-[13px] font-semibold tabular-nums',
                getMarketMoveClassName(direction === 0 ? 0 : (percent ?? gain)),
                className
            )}
            testID={testID}
        >
            {`${ARROW_BY_DIRECTION[direction]}${label}`}
        </ProtectedText>
    );
};
