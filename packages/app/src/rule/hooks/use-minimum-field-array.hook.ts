import { ArrayPath, FieldArray, FieldArrayPath, FieldValues, UseFieldArrayReturn, useFieldArray, useFormContext } from 'react-hook-form';

import { EmptyFn } from '@rnw-community/shared';

interface UseMinimumFieldArrayResult<T extends FieldValues, N extends ArrayPath<T>> extends UseFieldArrayReturn<T, N> {
    canRemove: boolean;
    safeRemove: (index: number) => void;
    add: EmptyFn;
}

export const useMinimumFieldArray = <T extends FieldValues, N extends FieldArrayPath<T>>(
    name: N,
    defaultValue: FieldArray<T, N>
): UseMinimumFieldArrayResult<T, N> => {
    const { control } = useFormContext<T>();
    const fieldArray = useFieldArray<T, N>({ control, name });

    const canRemove = fieldArray.fields.length > 1;

    const safeRemove = (index: number) => {
        if (canRemove) {
            fieldArray.remove(index);
        }
    };

    const add = () => {
        fieldArray.append(defaultValue);
    };

    return { ...fieldArray, canRemove, safeRemove, add };
};
