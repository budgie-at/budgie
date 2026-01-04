import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly title: string;
    readonly onAdd: EmptyFn;
}

export const RuleFormSectionHeader = ({ title, onAdd }: Props) => (
    <View className="flex-row items-center justify-between">
        <Text className="text-primary text-lg font-semibold">{title}</Text>

        <HapticPressable onPress={onAdd} className="bg-primary rounded-full px-lg py-xs flex-row items-center gap-x-xs">
            <Icon icon={UserIconNameEnum.Plus} className="text-primary-reverse" size={16} />

            <Text className="text-primary-reverse text-sm font-medium">
                <Trans>Add</Trans>
            </Text>
        </HapticPressable>
    </View>
);
