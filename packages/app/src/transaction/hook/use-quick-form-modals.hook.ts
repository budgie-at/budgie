import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useOpenModal } from '../../@generic/hook/use-open-modal/use-open-modal.hook';

export const useQuickFormModals = () => {
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const openDatePicker = useOpenModal('/date-picker');

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
