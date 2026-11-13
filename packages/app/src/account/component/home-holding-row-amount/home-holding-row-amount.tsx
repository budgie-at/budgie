import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { BrokerageReturnText } from '../../../brokerage/component/brokerage-return-text/brokerage-return-text';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { HomeHoldingRowSelector } from '../home-holding-row/home-holding-row.selector';

import type { HoldingReturnInterface } from '../../interface/holding-return.interface';
import type { HomeHoldingInterface } from '../../interface/home-holding.interface';

interface Props {
    readonly holding: Pick<HomeHoldingInterface, 'instrument' | 'value' | 'isValued'>;
    readonly holdingReturn: HoldingReturnInterface | undefined;
    readonly isReturnLoading: boolean;
}

const amountVariants = cva('gap-y-xxs', {
    variants: { isStacked: { true: 'items-start', false: 'max-w-[55%] shrink-0 items-end' } }
});

export const HomeHoldingRowAmount = ({ holding, holdingReturn, isReturnLoading }: Props) => {
    const isStacked = useIsAccessibilityTextSize();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();

    const instrumentCode = holding.instrument.code;
    const isReturnPending = isReturnLoading && !isDefined(holdingReturn);
    const percent =
        isDefined(holdingReturn) && isPositiveNumber(holdingReturn.costBasis) ? holdingReturn.gain / holdingReturn.costBasis : null;

    return (
        <View className={amountVariants({ isStacked })}>
            {holding.isValued ? (
                <ProtectedText
                    className="text-[17px] font-semibold tracking-tight tabular-nums text-primary"
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                    numberOfLines={1}
                    maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                    testID={HomeHoldingRowSelector.Value(instrumentCode)}
                >
                    {formatDigits(holding.value, defaultInstrument.symbol)}
                </ProtectedText>
            ) : (
                <Text className="text-[15px] font-medium text-secondary-foreground" maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}>
                    <Trans>Value unavailable</Trans>
                </Text>
            )}
            {isDefined(holdingReturn) || isReturnPending ? (
                <LoadingContent isLoading={isReturnPending} loadingIndicator={null}>
                    <BrokerageReturnText
                        gain={holdingReturn?.gain ?? 0}
                        percent={percent}
                        instrumentSymbol={defaultInstrument.symbol}
                        testID={HomeHoldingRowSelector.Return(instrumentCode)}
                    />
                </LoadingContent>
            ) : null}
        </View>
    );
};
