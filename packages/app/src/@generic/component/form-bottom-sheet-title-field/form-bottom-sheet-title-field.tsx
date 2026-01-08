import { useEffect, useRef } from 'react';
import { Control, Controller, FieldValues, Path, UseControllerReturn } from 'react-hook-form';
import { InteractionManager } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';

import { BottomSheetTextInput } from '../bottom-sheet-text-input/bottom-sheet-text-input';
import { FormItem } from '../form-item/form-item';

interface Props<T extends FieldValues> {
    readonly control: Control<T>;
    readonly label: string;
    readonly placeholder: string;
    readonly name?: Path<T>;
    readonly maxLength: number;
    readonly autoFocus?: boolean;
}

export const FormBottomSheetTitleField = <T extends FieldValues>({
    control,
    label,
    placeholder,
    name = 'title' as Path<T>,
    maxLength,
    autoFocus = false
}: Props<T>) => {
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (autoFocus) {
            InteractionManager.runAfterInteractions(() => {
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 350);
            });
        }
    }, [autoFocus]);

    const render = ({ field: { value, onChange }, fieldState: { error, invalid } }: UseControllerReturn<T>) => {
        const status = invalid ? 'error' : 'default';

        return (
            <FormItem label={label} error={error?.message}>
                <BottomSheetTextInput
                    ref={inputRef}
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
