import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly title: string;
    readonly onAdd: EmptyFn;
}

export const RuleFormSectionHeader = ({ title, onAdd }: Props) => (
    <View className="flex-row items-center justify-between">
        <Text className="text-primary text-lg font-semibold">{title}</Text>

        <HapticPressable onPress={onAdd}>
            <CircleIcon icon={UserIconNameEnum.Plus} variant="ghost" size={26} iconSize={14} />
        </HapticPressable>
    </View>
);
