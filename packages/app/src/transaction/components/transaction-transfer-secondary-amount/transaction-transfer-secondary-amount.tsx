import { convertFromMicroUnits } from '@budgie/contracts';
import { Text } from 'react-native';

import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';

import type { AggregatedTransactionEntryInterface } from '../../interface/aggregated-transaction-entry.interface';

interface Props {
    readonly fromEntry: AggregatedTransactionEntryInterface;
    readonly toEntry: AggregatedTransactionEntryInterface;
    readonly accountId: number | null;
}

export const TransactionTransferSecondaryAmount = ({ fromEntry, toEntry, accountId }: Props) => {
    const formatDigits = useFormatInstrumentAmount();

    const secondaryEntry = accountId === toEntry.account.id ? fromEntry : toEntry;
    const { instrument } = secondaryEntry.account;

    if (fromEntry.account.instrument.id === toEntry.account.instrument.id) {
        return null;
    }

    return (
        <Text
            className="text-[13px] leading-[18px] text-secondary-foreground text-right tabular-nums"
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
        >
            {formatDigits(convertFromMicroUnits(secondaryEntry.amount), instrument.symbol, instrument.type)}
        </Text>
    );
};
