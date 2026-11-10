import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { usePickDate } from '../../@generic/hook/use-pick-date.hook';

export const useQuickFormModals = () => {
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const pickDate = usePickDate();

    const operatedAt = useWatch({ control, name: 'operatedAt' });

    const handleDatePress = () => {
        pickDate(operatedAt, selectedDate => {
            setValue('operatedAt', selectedDate, { shouldDirty: true });
        });
    };

    return { handleDatePress };
};
