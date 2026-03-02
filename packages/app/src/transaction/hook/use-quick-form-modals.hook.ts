import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useDatePickerModal } from '../context/date-picker-modal.context';
import { useNoteInputModal } from '../context/note-input-modal.context';

interface UseQuickFormModalsResult {
    readonly handleCommentPress: () => Promise<void>;
    readonly handleDatePress: () => Promise<void>;
}

export const useQuickFormModals = (): UseQuickFormModalsResult => {
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openDatePicker] = useDatePickerModal();
    const [openNoteInput] = useNoteInputModal();

    const [operatedAt, comment] = useWatch({ control, name: ['operatedAt', 'comment'] });

    const handleCommentPress = async () => {
        const result = await openNoteInput({ initialValue: comment });

        if (isDefined(result)) {
            setValue('comment', result);
        }
    };

    const handleDatePress = async () => {
        const result = await openDatePicker({ initialDate: operatedAt });

        if (isDefined(result)) {
            setValue('operatedAt', result);
        }
    };

    return { handleCommentPress, handleDatePress };
};
