import { Keyboard, ScrollView } from 'react-native';

import { INSTALLMENT_COUNT_OPTIONS } from '../../constant/installment-count-options.constant';
import { InstallmentCountChip } from '../installment-count-chip/installment-count-chip';

interface Props {
    readonly selectedCount: number;
    readonly onSelect: (count: number) => void;
}

export const InstallmentCountChips = ({ selectedCount, onSelect }: Props) => {
    const handleSelect = (count: number) => {
        Keyboard.dismiss();
        onSelect(count);
    };

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="-mx-xl"
            contentContainerClassName="flex-grow gap-x-xs px-xl"
        >
            {INSTALLMENT_COUNT_OPTIONS.map(count => (
                <InstallmentCountChip key={count} count={count} isSelected={count === selectedCount} onSelect={handleSelect} />
            ))}
        </ScrollView>
    );
};
