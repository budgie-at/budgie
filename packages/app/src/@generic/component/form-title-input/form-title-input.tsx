import { Input } from '../input/input';

interface Props {
    readonly value: string;
    readonly onChangeText: (value: string) => void;
    readonly onBlur: () => void;
    readonly maxLength: number;
    readonly placeholder: string;
    readonly accessibilityLabel: string;
    readonly autoFocus: boolean;
    readonly testID: string;
}

export const FormTitleInput = (props: Props) => (
    <Input
        {...props}
        borderless
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        className="h-auto min-h-[28px] px-0 text-(length:--text-lg)"
    />
);
