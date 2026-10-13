import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useDatePickerModal } from '../context/date-picker-modal.context';
import { useNoteInputModal } from '../context/note-input-modal.context';

interface UseQuickFormModalsResult {
    readonly handleCommentPress: () => void;
    readonly handleDatePress: () => void;
}

export const useQuickFormModals = (): UseQuickFormModalsResult => {
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openDatePicker] = useDatePickerModal();
    const [openNoteInput] = useNoteInputModal();

    const [operatedAt, comment] = useWatch({ control, name: ['operatedAt', 'comment'] });

    const handleCommentPress = () => {
        openNoteInput({ initialValue: comment }, noteText => {
            if (isDefined(noteText)) {
                setValue('comment', noteText);
            }
        });
    };

    const handleDatePress = () => {
        openDatePicker({ initialDate: operatedAt }, selectedDate => {
            if (isDefined(selectedDate)) {
                setValue('operatedAt', selectedDate);
            }
        });
    };

    return { handleCommentPress, handleDatePress };
};
