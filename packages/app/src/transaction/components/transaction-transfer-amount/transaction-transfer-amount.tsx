import { InstrumentTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
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
    const primaryEntry = isIncoming ? toEntry : fromEntry;
    const secondaryEntry = isIncoming ? fromEntry : toEntry;

    const sign = isIncoming ? '+' : '';
    const formatEntry = (entry: AggregatedTransactionEntryInterface) =>
        formatDigits(convertFromMicroUnits(entry.amount), entry.account.instrument.symbol, entry.account.instrument.type);
    const isCrossCurrency = primaryEntry.account.instrument.id !== secondaryEntry.account.instrument.id;

    return (
        <View className="shrink-0 gap-y-xxs items-end" testID={testID}>
            {primaryEntry.account.instrument.type === InstrumentTypeEnum.FIAT ? (
                <MoneyText
                    amount={convertFromMicroUnits(primaryEntry.amount)}
                    instrumentSymbol={primaryEntry.account.instrument.symbol}
                    variant={MoneyTextVariantEnum.ROW}
                    prefix={sign}
                    tone="primary"
                />
            ) : (
                <Text className="text-[17px] font-semibold tracking-tight text-right text-primary tabular-nums">{`${sign}${formatEntry(primaryEntry)}`}</Text>
            )}
            {isCrossCurrency ? (
                <Text className="text-secondary-foreground text-[13px] text-right tabular-nums">{formatEntry(secondaryEntry)}</Text>
            ) : null}
        </View>
    );
};
