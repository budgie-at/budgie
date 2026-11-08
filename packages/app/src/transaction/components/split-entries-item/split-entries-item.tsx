import { TransactionEntryCreateInputInterface } from '@budgie/contracts';
import { useEffect, useRef } from 'react';
import { TextInput, View } from 'react-native';

import { SplitEntryDeleteButton } from '../split-entry-delete-button/split-entry-delete-button';
import { SplitEntryRow } from '../split-entry-row/split-entry-row';

interface Props {
    readonly entry: Pick<TransactionEntryCreateInputInterface, 'categoryId' | 'amount'>;
    readonly index: number;
    readonly currencySymbol: string;
    readonly autoFocus: boolean;
    readonly entryCount: number;
    readonly onAmountChange: (index: number, amount: number) => void;
    readonly onCategoryPress: (index: number) => void;
    readonly onDelete: (index: number) => void;
}

export const SplitEntriesItem = ({
    entry,
    index,
    currencySymbol,
    autoFocus,
    entryCount,
    onAmountChange,
    onCategoryPress,
    onDelete
}: Props) => {
    const amountRef = useRef<TextInput>(null);
    const handleCategoryPress = () => void onCategoryPress(index);
    const handleDelete = () => void onDelete(index);
    const handleAmountChange = (amount: number) => void onAmountChange(index, amount);

    useEffect(() => {
        if (autoFocus) {
            amountRef.current?.focus();
        }
    }, [autoFocus]);

    return (
        <View>
            {index > 0 ? <View className="h-hairline bg-surface-separator ml-[72px]" /> : null}
            <SplitEntryRow
                index={index}
                entry={entry}
                currencySymbol={currencySymbol}
                amountRef={amountRef}
                onAmountChange={handleAmountChange}
                onCategoryPress={handleCategoryPress}
            >
                {entryCount > 1 ? <SplitEntryDeleteButton index={index} categoryId={entry.categoryId} onPress={handleDelete} /> : null}
            </SplitEntryRow>
        </View>
    );
};
