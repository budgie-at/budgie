import { Text } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly label: string;
    readonly onPress: () => void;
    readonly disabled?: boolean;
    readonly isLoading?: boolean;
    readonly testID?: string;
}

export const TransactionPickerAction = ({ label, onPress, disabled, isLoading, testID }: Props) => {
    const isDisabled = disabled || isLoading;
    const backgroundClassName = isDisabled ? 'bg-cta-disabled-background opacity-100' : 'bg-positive-action';
    const foregroundClassName = isDisabled ? 'text-secondary-foreground' : 'text-positive-action-foreground';

    return (
        <Button
            content={
                <Text
                    dynamicTypeRamp="headline"
                    maxFontSizeMultiplier={1.3}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    className={cn('text-[17px] font-semibold text-center', foregroundClassName)}
                >
                    {label}
                </Text>
            }
            accessibilityLabel={label}
            onPress={onPress}
            disabled={disabled}
            isLoading={isLoading}
            testID={testID}
            variant="positive"
            className={cn('min-h-14 rounded-3xl px-xl py-md', backgroundClassName)}
        />
    );
};
