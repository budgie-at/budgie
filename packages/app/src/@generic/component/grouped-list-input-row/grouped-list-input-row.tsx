import { Text, View, useWindowDimensions } from 'react-native';

import { useIsAccessibilityTextSize } from '../../hook/use-is-accessibility-text-size.hook';
import { cn } from '../../utils/cn.util';
import { GroupedListIcon } from '../grouped-list-icon/grouped-list-icon';
import { Input } from '../input/input';

import type { UserIconType } from '@budgie/contracts';
import type { ComponentProps } from 'react';

type InputProps = Pick<
    ComponentProps<typeof Input>,
    'value' | 'onChangeText' | 'onBlur' | 'placeholder' | 'testID' | 'keyboardType' | 'maxLength' | 'maxFontSizeMultiplier'
>;

type Props = InputProps & {
    readonly icon: UserIconType;
    readonly label: string;
};

const INPUT_LINE_HEIGHT = 28;

export const GroupedListInputRow = ({ icon, label, ...inputProps }: Props) => {
    const { fontScale } = useWindowDimensions();
    const isStacked = useIsAccessibilityTextSize();
    const alignClassName = isStacked ? 'items-start' : 'items-center';
    const inputStyle = { minHeight: INPUT_LINE_HEIGHT * Math.min(fontScale, inputProps.maxFontSizeMultiplier ?? fontScale) };

    return (
        <View className={cn('min-h-[50px] flex-row gap-x-xl px-3xl py-lg', alignClassName)}>
            <GroupedListIcon icon={icon} />
            <View className="flex-1 gap-y-md">
                <Text className="text-secondary-foreground text-[13px]">{label}</Text>
                <Input
                    {...inputProps}
                    borderless
                    className="h-auto px-0 text-(length:--text-lg)"
                    style={inputStyle}
                    accessibilityLabel={label}
                    returnKeyType="done"
                />
            </View>
        </View>
    );
};
