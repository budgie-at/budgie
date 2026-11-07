import { Text, View, useWindowDimensions } from 'react-native';

import { GroupedListIcon } from '../grouped-list-icon/grouped-list-icon';
import { Input } from '../input/input';

import type { UserIconType } from '@budgie/contracts';
import type { ComponentProps } from 'react';

type InputProps = Pick<
    ComponentProps<typeof Input>,
    'value' | 'onChangeText' | 'onBlur' | 'placeholder' | 'testID' | 'keyboardType' | 'maxLength'
>;

type Props = InputProps & {
    readonly icon: UserIconType;
    readonly label: string;
};

const INPUT_LINE_HEIGHT = 28;

export const GroupedListInputRow = ({ icon, label, ...inputProps }: Props) => {
    const { fontScale } = useWindowDimensions();
    const inputStyle = { minHeight: INPUT_LINE_HEIGHT * fontScale };

    return (
        <View className="min-h-[50px] flex-row items-center gap-x-xl px-3xl py-lg">
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
