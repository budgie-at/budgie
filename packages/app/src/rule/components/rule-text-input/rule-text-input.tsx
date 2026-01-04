import { KeyboardTypeOptions, TextInput } from 'react-native';

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    keyboardType?: KeyboardTypeOptions;
}

export const RuleTextInput = ({ value, onChange, placeholder, keyboardType }: Props) => (
    <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType}
        className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner text-primary"
        placeholderTextColor="#888"
    />
);
