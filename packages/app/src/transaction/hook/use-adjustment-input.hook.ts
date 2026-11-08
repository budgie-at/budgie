import { convertToMicroUnits } from '@budgie/contracts';
import { useReducer } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useKeypadInput } from './use-keypad-input.hook';

export const useAdjustmentInput = (initialAmount: number, initialIsIncrease: boolean, initialComment: string) => {
    const form = useForm({ defaultValues: { comment: initialComment } });
    const comment = useWatch({ control: form.control, name: 'comment' });
    const [isIncrease, toggleIsIncrease] = useReducer((current: boolean) => !current, initialIsIncrease);
    const keypad = useKeypadInput({ initialValue: initialAmount });

    return {
        form,
        comment,
        isIncrease,
        toggleIsIncrease,
        displayValue: keypad.displayValue,
        numericValue: keypad.numericValue,
        handlers: keypad.handlers,
        isUnchanged:
            isIncrease === initialIsIncrease &&
            convertToMicroUnits(keypad.numericValue) === convertToMicroUnits(initialAmount) &&
            comment === initialComment
    };
};
