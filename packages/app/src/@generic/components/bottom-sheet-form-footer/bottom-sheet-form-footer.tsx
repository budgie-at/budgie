import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
}

export const BottomSheetFormFooter = ({onSubmit, onCancel}: Props) => (
    <View className="flex-row gap-x-md pt-md px-[20px]">
        <HapticPressable onPress={onCancel} className="bg-primary-reverse flex-1 rounded-5xl p-2xl border border-secondary-corner">
            <Text className="text-primary text-center">
                <Trans>Cancel</Trans>
            </Text>
        </HapticPressable>

        <HapticPressable
            onPress={onSubmit}
            className="bg-primary flex-1 rounded-5xl p-2xl flex-row gap-x-md items-center justify-center"
        >
            <Icon icon={ICONS.Check} className="text-primary-reverse" size={16} />

            <Text className="text-primary-reverse text-center">
                <Trans>Submit</Trans>
            </Text>
        </HapticPressable>
    </View>
);
