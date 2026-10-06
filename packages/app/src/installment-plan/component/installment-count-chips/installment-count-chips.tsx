import { useFormContext, useWatch } from 'react-hook-form';
import { Keyboard, ScrollView } from 'react-native';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { INSTALLMENT_COUNT_OPTIONS } from '../../constant/installment-count-options.constant';
import { InstallmentCountChip } from '../installment-count-chip/installment-count-chip';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';

interface Props {
    readonly amount: number;
}

export const InstallmentCountChips = ({ amount }: Props) => {
    const { control, setValue } = useFormContext<ConvertToInstallmentFormValues>();
    const installmentCount = useWatch({ control, name: 'installmentCount' });

    const handleSelect = (count: number) => {
        Keyboard.dismiss();
        setValue('installmentCount', count, { shouldValidate: true });
        setValue('totalAmount', convertFromMicroUnits(amount * count), { shouldValidate: true });
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
                <InstallmentCountChip key={count} count={count} isSelected={count === installmentCount} onSelect={handleSelect} />
            ))}
        </ScrollView>
    );
};
