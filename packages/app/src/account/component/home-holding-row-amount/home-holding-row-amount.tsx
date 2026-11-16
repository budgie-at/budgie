import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { ROW_PRIMARY_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-primary-max-font-size-multiplier.constant';
import { BrokerageReturnText } from '../../../brokerage/component/brokerage-return-text/brokerage-return-text';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { HomeAmountColumn } from '../home-amount-column/home-amount-column';
import { HomeAmountValue } from '../home-amount-value/home-amount-value';
import { HomeHoldingRowSelector } from '../home-holding-row/home-holding-row.selector';
import { HomeReturnSlot } from '../home-return-slot/home-return-slot';
import { HomeTodayChangeText } from '../home-today-change-text/home-today-change-text';

import type { HoldingReturnInterface } from '../../interface/holding-return.interface';
import type { HomeHoldingInterface } from '../../interface/home-holding.interface';

interface Props {
    readonly holding: Pick<HomeHoldingInterface, 'instrument' | 'value' | 'isValued'>;
    readonly holdingReturn: HoldingReturnInterface | undefined;
    readonly todayChange: number | undefined;
    readonly isReturnPending: boolean;
    readonly isReturnSuppressed: boolean;
}

const PLACEHOLDER_PERCENT = 0.9999;

export const HomeHoldingRowAmount = ({ holding, holdingReturn, todayChange, isReturnPending, isReturnSuppressed }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const instrumentCode = holding.instrument.code;
    const realPercent =
        isDefined(holdingReturn) && isPositiveNumber(holdingReturn.costBasis) ? holdingReturn.gain / holdingReturn.costBasis : null;
    const isToday = !isDefined(realPercent) && isDefined(todayChange);
    const isReturnEmpty = !isReturnPending && !isDefined(realPercent) && !isToday;

    return (
        <HomeAmountColumn>
            {holding.isValued ? (
                <HomeAmountValue amount={holding.value} testID={HomeHoldingRowSelector.Value(instrumentCode)} />
            ) : (
                <Text
                    className="text-[15px] font-medium text-secondary-foreground"
                    maxFontSizeMultiplier={ROW_PRIMARY_MAX_FONT_SIZE_MULTIPLIER}
                >
                    <Trans>Value unavailable</Trans>
                </Text>
            )}
            <HomeReturnSlot isSuppressed={isReturnSuppressed} isPending={isReturnPending} isEmpty={isReturnEmpty}>
                {isToday ? (
                    <HomeTodayChangeText
                        gain={null}
                        percent={todayChange}
                        maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                        testID={HomeHoldingRowSelector.Today(instrumentCode)}
                    />
                ) : (
                    <BrokerageReturnText
                        gain={null}
                        percent={realPercent ?? PLACEHOLDER_PERCENT}
                        instrumentSymbol={defaultInstrument.symbol}
                        maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                        testID={HomeHoldingRowSelector.Return(instrumentCode)}
                    />
                )}
            </HomeReturnSlot>
        </HomeAmountColumn>
    );
};
