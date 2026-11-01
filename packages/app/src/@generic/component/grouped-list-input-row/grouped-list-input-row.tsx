import { Text, View } from 'react-native';

import { GroupedListIcon } from '../grouped-list-icon/grouped-list-icon';
import { Input } from '../input/input';

import type { UserIconType } from '@budgie/contracts';
import type { ComponentProps } from 'react';

type InputProps = Pick<ComponentProps<typeof Input>, 'value' | 'onChangeText' | 'onBlur' | 'placeholder' | 'testID'>;

type Props = InputProps & {
    readonly icon: UserIconType;
    readonly label: string;
};

export const GroupedListInputRow = ({ icon, label, ...inputProps }: Props) => (
    <View className="min-h-[50px] flex-row items-center gap-x-xl px-3xl py-lg">
        <GroupedListIcon icon={icon} />
        <View className="flex-1">
            <Text className="text-secondary-foreground text-[13px]">{label}</Text>
            <Input
                {...inputProps}
                borderless
                className="h-[28px] px-0 text-(length:--text-lg)"
                accessibilityLabel={label}
                returnKeyType="done"
            />
        </View>
    </View>
);
