import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly canConfirm: boolean;
    readonly onConfirm: () => void;
    readonly confirmButtonClass: string;
    readonly confirmIconClass: string;
    readonly confirmTextClass: string;
}

export const AiTransactionConfirmButton = ({ canConfirm, onConfirm, confirmButtonClass, confirmIconClass, confirmTextClass }: Props) => (
    <HapticPressable disabled={!canConfirm} onPress={onConfirm} className={confirmButtonClass}>
        <View className="flex-row items-center gap-x-sm">
            <Icon icon={UserIconNameEnum.Check} size={18} className={confirmIconClass} />
            <Text className={confirmTextClass}>
                <Trans>Confirm</Trans>
            </Text>
        </View>
    </HapticPressable>
);
