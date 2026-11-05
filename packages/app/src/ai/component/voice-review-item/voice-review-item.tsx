import { View } from 'react-native';

import { SplitEntryDeleteButton } from '../../../transaction/components/split-entry-delete-button/split-entry-delete-button';
import { SplitEntryRow } from '../../../transaction/components/split-entry-row/split-entry-row';
import { VoiceReviewRowInterface } from '../../interface/voice-review-row.interface';

interface Props {
    readonly row: VoiceReviewRowInterface;
    readonly index: number;
    readonly currencySymbol: string;
    readonly canDelete: boolean;
    readonly onAmountChange: (id: string, amount: number) => void;
    readonly onCategoryPress: (id: string, categoryId: number | null) => void;
    readonly onDelete: (id: string) => void;
}

export const VoiceReviewItem = ({ row, index, currencySymbol, canDelete, onAmountChange, onCategoryPress, onDelete }: Props) => {
    const handleAmountChange = (amount: number) => void onAmountChange(row.id, amount);
    const handleCategoryPress = () => void onCategoryPress(row.id, row.categoryId);
    const handleDelete = () => void onDelete(row.id);

    return (
        <View className="border-t border-surface-separator">
            <SplitEntryRow
                index={index}
                entry={row}
                currencySymbol={currencySymbol}
                autoFocus={false}
                onAmountChange={handleAmountChange}
                onCategoryPress={handleCategoryPress}
            >
                {canDelete ? <SplitEntryDeleteButton index={index} categoryId={row.categoryId} onPress={handleDelete} /> : null}
            </SplitEntryRow>
        </View>
    );
};
