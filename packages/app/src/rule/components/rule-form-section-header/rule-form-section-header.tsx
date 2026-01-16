import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly title: string;
    readonly onAdd: EmptyFn;
    readonly testID?: string;
    readonly addButtonTestID?: string;
}

export const RuleFormSectionHeader = ({ title, onAdd, testID, addButtonTestID }: Props) => (
    <View testID={testID} className="flex-row items-center justify-between">
        <Text className="text-primary text-lg font-semibold">{title}</Text>

        <HapticPressable testID={addButtonTestID} onPress={onAdd}>
            <CircleIcon icon={UserIconNameEnum.Plus} variant="ghost" size={26} iconSize={14} />
        </HapticPressable>
    </View>
);
