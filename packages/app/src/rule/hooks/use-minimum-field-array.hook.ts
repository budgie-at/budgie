import { FieldArray, FieldArrayPath, FieldValues, useFieldArray, useFormContext } from 'react-hook-form';

import type { MinimumFieldArrayResultInterface } from '../interface/minimum-field-array-result.interface';

export const useMinimumFieldArray = <T extends FieldValues, N extends FieldArrayPath<T>>(
    name: N,
    defaultValue: FieldArray<T, N>
): MinimumFieldArrayResultInterface<T, N> => {
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
