import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { ICONS } from '../../constant/icons.constant';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly onSubmit: EmptyFn;
    readonly onCancel: EmptyFn;
}

export const FormBottomSheetFooter = ({ onSubmit, onCancel }: Props) => (
    <View className="flex-row gap-x-md px-5xl pt-2xl border-t border-t-secondary-corner">
        <HapticPressable onPress={onCancel} className="bg-primary-reverse flex-1 rounded-5xl p-2xl border border-secondary-corner">
            <Text className="text-primary text-center">
                <Trans>Cancel</Trans>
            </Text>
        </HapticPressable>

        <HapticPressable onPress={onSubmit} className="bg-primary flex-1 rounded-5xl p-2xl flex-row gap-x-md items-center justify-center">
            <Icon icon={ICONS.Check} className="text-primary-reverse" size={16} />

            <Text className="text-primary-reverse text-center">
                <Trans>Submit</Trans>
            </Text>
        </HapticPressable>
    </View>
);
