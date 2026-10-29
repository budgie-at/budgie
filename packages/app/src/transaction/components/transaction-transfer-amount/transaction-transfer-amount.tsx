import { convertFromMicroUnits } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import type { AggregatedTransactionEntryInterface } from '../../interface/aggregated-transaction-entry.interface';

interface Props {
    readonly fromEntry: AggregatedTransactionEntryInterface;
    readonly toEntry: AggregatedTransactionEntryInterface;
    readonly accountId: number | null;
    readonly testID: string;
}

export const TransactionTransferAmount = ({ fromEntry, toEntry, accountId, testID }: Props) => {
    const formatDigits = useDisplayFormatDigits();

    const isIncoming = accountId === toEntry.account.id;
    const primaryEntry = isIncoming ? toEntry : fromEntry;
    const secondaryEntry = isIncoming ? fromEntry : toEntry;

    const sign = isIncoming ? '+' : '';
    const primaryAmount = formatDigits(convertFromMicroUnits(primaryEntry.amount), primaryEntry.account.instrument.symbol);
    const secondaryAmount = formatDigits(convertFromMicroUnits(secondaryEntry.amount), secondaryEntry.account.instrument.symbol);
    const isCrossCurrency = primaryEntry.account.instrument.id !== secondaryEntry.account.instrument.id;

    return (
        <View className="gap-y-xxs items-end" testID={testID}>
            <Text className="text-[15px] font-semibold text-right text-primary tabular-nums">{`${sign}${primaryAmount}`}</Text>
            {isCrossCurrency ? (
                <Text className="text-secondary-foreground/70 text-[13px] text-right tabular-nums">{secondaryAmount}</Text>
            ) : null}
        </View>
    );
};
