import { convertFromMicroUnits } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';

import type { TransactionsDayNetAmountInterface } from '../../interface/transactions-day-net-amount.interface';

interface Props {
    readonly title: string;
    readonly netAmount: TransactionsDayNetAmountInterface | null;
}

export const TransactionSectionHeader = ({ title, netAmount }: Props) => {
    const protectAmount = useProtectedAmountLabel();

    const hasNetAmount = isDefined(netAmount) && netAmount.amount !== 0;
    const netAmountSign = hasNetAmount && isPositiveNumber(netAmount.amount) ? '+' : '−';
    const approximatePrefix = hasNetAmount && netAmount.isApproximate ? '≈ ' : '';
    const netAmountLabel = hasNetAmount
        ? `${approximatePrefix}${netAmountSign}${protectAmount(Math.abs(convertFromMicroUnits(netAmount.amount)), netAmount.instrumentSymbol)}`
        : null;

    return (
        <View className="min-h-[32px] flex-row flex-wrap items-center justify-between gap-x-md px-3xl py-xs">
            <Text
                maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                className="shrink text-primary text-[13px] font-semibold"
                numberOfLines={2}
            >
                {title}
            </Text>
            {isDefined(netAmountLabel) ? (
                <Text
                    maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                    className="shrink-0 text-secondary-foreground text-[13px] tabular-nums"
                    numberOfLines={1}
                >
                    {netAmountLabel}
                </Text>
            ) : null}
        </View>
    );
};
