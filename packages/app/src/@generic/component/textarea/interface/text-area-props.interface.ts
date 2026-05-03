import type { FormFieldStatus } from '../../../type/form-field-status.type';
import type { ComponentProps, RefObject } from 'react';
import type { TextInput } from 'react-native';


type BaseTextInputProps = Omit<ComponentProps<typeof TextInput>, 'multiline' | 'style' | 'ref'>;

export interface TextAreaProps extends BaseTextInputProps {
    readonly status?: FormFieldStatus;
    readonly borderless?: boolean;
    readonly size?: 'sm' | 'md' | 'lg';
    readonly minLines?: 1 | 2;
    readonly maxLines?: 2 | 3 | 4 | 5;
    readonly ref?: RefObject<TextInput | null>;
}
