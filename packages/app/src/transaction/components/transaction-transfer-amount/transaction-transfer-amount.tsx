import { InstrumentTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { TransactionFundTradeAmount } from '../transaction-fund-trade-amount/transaction-fund-trade-amount';

import type { AggregatedTransactionEntryInterface } from '../../interface/aggregated-transaction-entry.interface';

interface Props {
    readonly fromEntry: AggregatedTransactionEntryInterface;
    readonly toEntry: AggregatedTransactionEntryInterface;
    readonly accountId: number | null;
    readonly testID: string;
}

export const TransactionTransferAmount = ({ fromEntry, toEntry, accountId, testID }: Props) => {
    const formatDigits = useFormatInstrumentAmount();

    if (toEntry.account.instrument.type === InstrumentTypeEnum.FUND) {
        return <TransactionFundTradeAmount fundEntry={toEntry} moneyEntry={fromEntry} quantitySign="+" testID={testID} />;
    }

    if (fromEntry.account.instrument.type === InstrumentTypeEnum.FUND) {
        return <TransactionFundTradeAmount fundEntry={fromEntry} moneyEntry={toEntry} quantitySign="−" testID={testID} />;
    }

    const isIncoming = accountId === toEntry.account.id;
    const primaryEntry = isIncoming ? toEntry : fromEntry;
    const secondaryEntry = isIncoming ? fromEntry : toEntry;

    const sign = isIncoming ? '+' : '';
    const formatEntry = (entry: AggregatedTransactionEntryInterface) =>
        formatDigits(convertFromMicroUnits(entry.amount), entry.account.instrument.symbol, entry.account.instrument.type);
    const isCrossCurrency = primaryEntry.account.instrument.id !== secondaryEntry.account.instrument.id;

    return (
        <View className="shrink-0 gap-y-xxs items-end" testID={testID}>
            <Text className="text-[15px] font-semibold text-right text-primary tabular-nums">{`${sign}${formatEntry(primaryEntry)}`}</Text>
            {isCrossCurrency ? (
                <Text className="text-secondary-foreground text-[13px] text-right tabular-nums">{formatEntry(secondaryEntry)}</Text>
            ) : null}
        </View>
    );
};
