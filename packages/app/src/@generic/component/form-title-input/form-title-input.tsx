import { useDeferredAutoFocus } from '../../hook/use-deferred-auto-focus.hook';
import { Input } from '../input/input';

interface Props {
    readonly value: string;
    readonly onChangeText: (value: string) => void;
    readonly editable: boolean;
    readonly maxLength: number;
    readonly placeholder: string;
    readonly accessibilityLabel: string;
    readonly autoFocus: boolean;
    readonly testID: string;
}

export const FormTitleInput = ({ autoFocus, ...props }: Props) => {
    const { inputRef, autoFocus: isAutoFocus } = useDeferredAutoFocus(autoFocus);

    return (
        <Input
            {...props}
            ref={inputRef}
            autoFocus={isAutoFocus}
            borderless
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            className="h-auto min-h-[28px] px-0 text-(length:--text-lg)"
        />
    );
};
