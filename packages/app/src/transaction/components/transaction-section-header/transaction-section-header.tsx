import { convertFromMicroUnits } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

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
    const netAmountLabel = hasNetAmount
        ? `${netAmountSign}${protectAmount(Math.abs(convertFromMicroUnits(netAmount.amount)), netAmount.instrumentSymbol)}`
        : null;

    return (
        <View className="-mx-5xl h-[32px] flex-row items-center justify-between gap-x-md bg-surface px-[36px]">
            <Text className="shrink text-secondary-foreground text-[13px] leading-[16px] font-semibold" numberOfLines={1}>
                {title}
            </Text>
            {isDefined(netAmountLabel) ? (
                <Text className="text-secondary-foreground text-[13px] leading-[16px] font-medium tabular-nums" numberOfLines={1}>
                    {netAmountLabel}
                </Text>
            ) : null}
        </View>
    );
};
