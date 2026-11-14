import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatGainPercent } from '../../../i18n/hook/use-format-gain-percent.hook';
import { getMarketMoveClassName } from '../../../market-data/utils/get-market-move-class-name.util';
import { RETURN_ARROW_BY_DIRECTION } from '../../constant/return-arrow-by-direction.constant';

interface Props {
    readonly gain: number | null;
    readonly percent: number | null;
    readonly instrumentSymbol: string;
    readonly className?: string;
    readonly maxFontSizeMultiplier?: number;
    readonly testID?: string;
}

const CENTS_PER_UNIT = 100;
const PERCENT_DISPLAY_STEPS = 10_000;

export const BrokerageReturnText = ({
    gain,
    percent,
    instrumentSymbol,
    className,
    maxFontSizeMultiplier = ROW_MAX_FONT_SIZE_MULTIPLIER,
    testID
}: Props) => {
    const formatDigits = useDisplayFormatDigits();
    const formatPercent = useFormatGainPercent();

    const gainDirection = Math.sign(Math.round((gain ?? 0) * CENTS_PER_UNIT));
    const percentDirection = Math.sign(Math.round((percent ?? 0) * PERCENT_DISPLAY_STEPS));
    const direction = isDefined(gain) ? gainDirection : percentDirection;
    const label = [
        isDefined(gain) ? formatDigits(Math.abs(gain), instrumentSymbol) : null,
        isDefined(percent) ? formatPercent(percent) : null
    ]
        .filter(isDefined)
        .join(' · ');
    const lineCount = useIsAccessibilityTextSize() ? 2 : 1;

    return (
        <ProtectedText
            numberOfLines={lineCount}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            className={cn(
                'text-[13px] font-semibold tabular-nums',
                getMarketMoveClassName(direction === 0 ? 0 : (percent ?? gain ?? 0)),
                className
            )}
            testID={testID}
        >
            {`${RETURN_ARROW_BY_DIRECTION[direction]}${label}`}
        </ProtectedText>
    );
};
