import { InstrumentTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';

import type { AggregatedTransactionEntryInterface } from '../../interface/aggregated-transaction-entry.interface';

interface Props {
    readonly fromEntry: AggregatedTransactionEntryInterface;
    readonly toEntry: AggregatedTransactionEntryInterface;
    readonly accountId: number | null;
    readonly testID: string;
}

export const TransactionTransferAmount = ({ fromEntry, toEntry, accountId, testID }: Props) => {
    const formatDigits = useFormatInstrumentAmount();

    const isIncoming = accountId === toEntry.account.id;
    const contextEntry = isIncoming ? toEntry : fromEntry;
    const counterpartEntry = isIncoming ? fromEntry : toEntry;
    const isFundContext =
        contextEntry.account.instrument.type === InstrumentTypeEnum.FUND &&
        counterpartEntry.account.instrument.type !== InstrumentTypeEnum.FUND;
    const primaryEntry = isFundContext ? counterpartEntry : contextEntry;
    const secondaryEntry = isFundContext ? contextEntry : counterpartEntry;

    const sign = isIncoming ? '+' : '';
    const secondarySign = isFundContext ? sign : '';
    const formatEntry = (entry: AggregatedTransactionEntryInterface) =>
        formatDigits(convertFromMicroUnits(entry.amount), entry.account.instrument.symbol, entry.account.instrument.type);
    const primaryAmount = formatEntry(primaryEntry);
    const secondaryAmount = formatEntry(secondaryEntry);
    const isCrossCurrency = primaryEntry.account.instrument.id !== secondaryEntry.account.instrument.id;

    return (
        <View className="shrink-0 gap-y-xxs items-end" testID={testID}>
            <Text className="text-[15px] font-semibold text-right text-primary tabular-nums">{`${sign}${primaryAmount}`}</Text>
            {isCrossCurrency ? (
                <Text className="text-secondary-foreground text-[13px] text-right tabular-nums">{`${secondarySign}${secondaryAmount}`}</Text>
            ) : null}
        </View>
    );
};
