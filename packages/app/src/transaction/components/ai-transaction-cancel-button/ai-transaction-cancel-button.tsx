import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly onCancel: () => void;
}

export const AiTransactionCancelButton = ({ onCancel }: Props) => (
    <HapticPressable onPress={onCancel} className="flex-1 py-4xl rounded-2xl bg-secondary-background items-center justify-center">
        <View className="flex-row items-center gap-x-sm">
            <Icon icon={UserIconNameEnum.X} size={18} className="text-secondary-foreground" />
            <Text className="text-secondary-foreground font-medium">
                <Trans>Cancel</Trans>
            </Text>
        </View>
    </HapticPressable>
);
