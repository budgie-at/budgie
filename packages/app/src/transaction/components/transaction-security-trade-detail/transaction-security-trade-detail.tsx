import { convertFromMicroUnits } from '@budgie/contracts';
import { Text } from 'react-native';

import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { isSecurityInstrumentType } from '../../../instrument/utils/is-security-instrument-type.util';

import type { AggregatedTransactionEntryInterface } from '../../interface/aggregated-transaction-entry.interface';

interface Props {
    readonly fromEntry: AggregatedTransactionEntryInterface;
    readonly toEntry: AggregatedTransactionEntryInterface;
    readonly fee: number;
}

export const TransactionSecurityTradeDetail = ({ fromEntry, toEntry, fee }: Props) => {
    const formatInstrumentAmount = useFormatInstrumentAmount();

    const isBuy = isSecurityInstrumentType(toEntry.account.instrument.type);
    const [securityEntry, moneyEntry] = isBuy ? [toEntry, fromEntry] : [fromEntry, toEntry];
    const cash = formatInstrumentAmount(convertFromMicroUnits(moneyEntry.amount - fee), moneyEntry.account.instrument.symbol, null);
    const quantity = formatInstrumentAmount(
        convertFromMicroUnits(securityEntry.amount),
        securityEntry.account.instrument.symbol,
        securityEntry.account.instrument.type
    );
    const detail = isBuy ? `${cash} → +${quantity}` : `−${quantity} → ${cash}`;

    return <Text className="text-secondary-foreground text-[13px] text-right tabular-nums">{detail}</Text>;
};
