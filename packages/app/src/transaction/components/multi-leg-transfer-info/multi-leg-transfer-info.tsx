import { TransactionEntryWithRelationsEntityInterface } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Text, View } from 'react-native';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TransferLegCard, TransferLegInterface } from '../transfer-leg-card/transfer-leg-card';

interface Props {
    readonly entries: TransactionEntryWithRelationsEntityInterface[];
}

const sortByAmountDesc = (
    first: TransactionEntryWithRelationsEntityInterface,
    second: TransactionEntryWithRelationsEntityInterface
): number => Math.abs(second.amount) - Math.abs(first.amount);

const groupEntriesIntoLegs = (entries: TransactionEntryWithRelationsEntityInterface[]): TransferLegInterface[] => {
    const expenseEntries = entries.filter(entry => entry.amount < 0).sort(sortByAmountDesc);
    const incomeEntries = entries.filter(entry => entry.amount > 0).sort(sortByAmountDesc);

    const legs: TransferLegInterface[] = [];
    const usedIncomeIndices = new Set<number>();

    for (const expense of expenseEntries) {
        const matchingIncomeIndex = incomeEntries.findIndex((income, idx) => {
            if (usedIncomeIndices.has(idx)) {
                return false;
            }

            if (expense.toIban === income.account.iban) {
                return true;
            }

            if (expense.account.instrumentId === income.account.instrumentId) {
                return Math.abs(expense.amount) === income.amount;
            }

            return false;
        });

        if (matchingIncomeIndex !== -1) {
            usedIncomeIndices.add(matchingIncomeIndex);
            legs.push({
                fromEntry: expense,
                toEntry: incomeEntries[matchingIncomeIndex]
            });
        }
    }

    return legs;
};

export const MultiLegTransferInfo = ({ entries }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const legs = groupEntriesIntoLegs(entries);

    if (legs.length === 0) {
        return null;
    }

    const legsCount = legs.length;

    return (
        <View className="mb-lg">
            <Text className="text-xs text-secondary-foreground font-medium mb-sm px-md">{t`Multi-leg Transfer (${legsCount} legs)`}</Text>
            {legs.map((leg, index) => (
                <TransferLegCard key={leg.fromEntry.id} leg={leg} isLast={index === legs.length - 1} formatDigits={formatDigits} />
            ))}
        </View>
    );
};
