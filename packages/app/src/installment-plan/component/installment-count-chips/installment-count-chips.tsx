import { ScrollView } from 'react-native';

import { InstallmentCountChip } from '../installment-count-chip/installment-count-chip';

const INSTALLMENT_COUNT_OPTIONS = [2, 3, 4, 6, 10, 12, 24] as const;

interface Props {
    readonly selectedCount: number;
    readonly minimumCount: number;
    readonly onSelect: (count: number) => void;
}

export const InstallmentCountChips = ({ selectedCount, minimumCount, onSelect }: Props) => (
    <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="-mx-xl"
        contentContainerClassName="flex-grow gap-x-xs px-xl"
    >
        {INSTALLMENT_COUNT_OPTIONS.map(count => (
            <InstallmentCountChip
                key={count}
                count={count}
                isSelected={count === selectedCount}
                minimumCount={minimumCount}
                onSelect={onSelect}
            />
        ))}
    </ScrollView>
);
