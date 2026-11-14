import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { ROW_PRIMARY_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-primary-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { BrokerageReturnText } from '../../../brokerage/component/brokerage-return-text/brokerage-return-text';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { HomeHoldingRowSelector } from '../home-holding-row/home-holding-row.selector';
import { HomeTodayChangeText } from '../home-today-change-text/home-today-change-text';

import type { HoldingReturnInterface } from '../../interface/holding-return.interface';
import type { HomeHoldingInterface } from '../../interface/home-holding.interface';

interface Props {
    readonly holding: Pick<HomeHoldingInterface, 'instrument' | 'value' | 'isValued'>;
    readonly holdingReturn: HoldingReturnInterface | undefined;
    readonly todayChange: number | undefined;
    readonly isReturnLoading: boolean;
}

const PLACEHOLDER_PERCENT = 0.9999;

const amountVariants = cva('gap-y-xxs', {
    variants: { isStacked: { true: 'items-start', false: 'max-w-[42%] shrink-0 items-end' } }
});

export const HomeHoldingRowAmount = ({ holding, holdingReturn, todayChange, isReturnLoading }: Props) => {
    const isStacked = useIsAccessibilityTextSize();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();

    const instrumentCode = holding.instrument.code;
    const isToday = !isDefined(holdingReturn) && isDefined(todayChange);
    const isReturnPending = isReturnLoading && !isDefined(holdingReturn) && !isToday;
    const realPercent =
        isDefined(holdingReturn) && isPositiveNumber(holdingReturn.costBasis) ? holdingReturn.gain / holdingReturn.costBasis : null;
    const percent = isDefined(holdingReturn) ? realPercent : PLACEHOLDER_PERCENT;
    const rowGain = isDefined(percent) ? null : (holdingReturn?.gain ?? holding.value);
    const isReturnEmpty = !isReturnPending && !isDefined(holdingReturn) && !isToday;
    const importantForAccessibility = isReturnEmpty ? 'no-hide-descendants' : 'auto';

    return (
        <View className={amountVariants({ isStacked })}>
            {holding.isValued ? (
                <ProtectedText
                    className="text-[17px] font-semibold tracking-tight tabular-nums text-primary"
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                    numberOfLines={1}
                    maxFontSizeMultiplier={ROW_PRIMARY_MAX_FONT_SIZE_MULTIPLIER}
                    testID={HomeHoldingRowSelector.Value(instrumentCode)}
                >
                    {formatDigits(holding.value, defaultInstrument.symbol)}
                </ProtectedText>
            ) : (
                <Text
                    className="text-[15px] font-medium text-secondary-foreground"
                    maxFontSizeMultiplier={ROW_PRIMARY_MAX_FONT_SIZE_MULTIPLIER}
                >
                    <Trans>Value unavailable</Trans>
                </Text>
            )}
            <View
                className={cn(isReturnEmpty && 'opacity-0')}
                accessibilityElementsHidden={isReturnEmpty}
                importantForAccessibility={importantForAccessibility}
            >
                <LoadingContent isLoading={isReturnPending} loadingIndicator={null}>
                    {isToday ? (
                        <HomeTodayChangeText
                            gain={null}
                            percent={todayChange}
                            maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                            testID={HomeHoldingRowSelector.Today(instrumentCode)}
                        />
                    ) : (
                        <BrokerageReturnText
                            gain={rowGain}
                            percent={percent}
                            instrumentSymbol={defaultInstrument.symbol}
                            maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                            testID={HomeHoldingRowSelector.Return(instrumentCode)}
                        />
                    )}
                </LoadingContent>
            </View>
        </View>
    );
};
