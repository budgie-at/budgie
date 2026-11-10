import { isDefined } from '@rnw-community/shared';

import { useOpenModal } from './use-open-modal/use-open-modal.hook';

export const usePickDate = () => {
    const openDatePicker = useOpenModal('/date-picker');

    return (initialDate: Date, onPick: (date: Date) => void) => {
        openDatePicker({ initialDate }, selectedDate => {
            if (isDefined(selectedDate)) {
                onPick(selectedDate);
            }
        });
    };
};
