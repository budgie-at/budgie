import { View } from 'react-native';

import { MIN_INSTALLMENT_COUNT } from '../../constant/convert-to-installment-form-schema.constant';
import { InstallmentCountChips } from '../installment-count-chips/installment-count-chips';
import { InstallmentCountStepper } from '../installment-count-stepper/installment-count-stepper';

interface Props {
    readonly selectedCount: number;
    readonly minimumCount?: number;
    readonly onSelect: (count: number) => void;
}

export const InstallmentCountPicker = ({ selectedCount, minimumCount = MIN_INSTALLMENT_COUNT, onSelect }: Props) => {
    const lowestCount = Math.max(minimumCount, MIN_INSTALLMENT_COUNT);

    return (
        <View className="gap-y-md">
            <InstallmentCountStepper count={selectedCount} minimumCount={lowestCount} onChange={onSelect} />
            <InstallmentCountChips selectedCount={selectedCount} minimumCount={lowestCount} onSelect={onSelect} />
        </View>
    );
};
