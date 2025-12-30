import { Control, Controller, FieldValues, Path, UseControllerReturn } from 'react-hook-form';

import { BottomSheetTextInput } from '../bottom-sheet-text-input/bottom-sheet-text-input';
import { FormItem } from '../form-item/form-item';

interface Props<T extends FieldValues> {
    readonly control: Control<T>;
    readonly label: string;
    readonly placeholder: string;
    readonly name?: Path<T>;
    readonly maxLength: number;
}

export const FormBottomSheetTitleField = <T extends FieldValues>({
    control,
    label,
    placeholder,
    name = 'title' as Path<T>,
    maxLength
}: Props<T>) => {
    const render = ({ field: { value, onChange }, fieldState: { error, invalid } }: UseControllerReturn<T>) => {
        const status = invalid ? 'error' : 'default';

        return (
            <FormItem label={label} error={error?.message}>
                <BottomSheetTextInput
                    value={value}
                    status={status}
                    maxLength={maxLength}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    className="text-md text-primary placeholder:text-secondary-foreground h-[56px] px-5xl bg-secondary-background rounded-5xl border border-secondary-corner"
                />
            </FormItem>
        );
    };

    return <Controller name={name} control={control} render={render} />;
};
