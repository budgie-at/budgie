import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useDatePickerModal } from '../context/date-picker-modal.context';

export const useQuickFormModals = () => {
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openDatePicker] = useDatePickerModal();

    const operatedAt = useWatch({ control, name: 'operatedAt' });

    const handleDatePress = () => {
        openDatePicker({ initialDate: operatedAt }, selectedDate => {
            if (isDefined(selectedDate)) {
                setValue('operatedAt', selectedDate, { shouldDirty: true });
            }
        });
    };

    return { handleDatePress };
};
