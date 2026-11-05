import { Text } from 'react-native';

import { Button } from '../../../@generic/component/button/button';

interface Props {
    readonly label: string;
    readonly onPress: () => void;
    readonly disabled?: boolean;
    readonly isLoading?: boolean;
    readonly testID?: string;
}

export const TransactionPickerAction = ({ label, onPress, disabled, isLoading, testID }: Props) => (
    <Button
        content={
            <Text dynamicTypeRamp="headline" className="text-[17px] font-semibold text-center">
                {label}
            </Text>
        }
        accessibilityLabel={label}
        onPress={onPress}
        disabled={disabled}
        isLoading={isLoading}
        testID={testID}
        variant="cta"
        className="min-h-14 rounded-3xl px-xl py-md"
    />
);
