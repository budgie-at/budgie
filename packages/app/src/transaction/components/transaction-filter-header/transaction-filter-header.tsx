import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { ICONS, IconName } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly title: string;
    readonly icon: IconName;
    readonly onClear: EmptyFn;
    readonly showClear: boolean;
}

export const TransactionFilterHeader = ({ onClear, showClear, title, icon }: Props) => (
    <View className="flex-row items-center gap-x-xl px-7xl py-3xl border-b border-b-secondary-corner">
        <CircleIcon icon={ICONS[icon]} variant="ghost" size="xl" />

        <Text className="text-primary font-semibold text-3xl mr-auto">{title}</Text>

        {showClear ? (
            <HapticPressable onPress={onClear}>
                <Text className="text-primary text-sm font-medium">
                    <Trans>Clear</Trans>
                </Text>
            </HapticPressable>
        ) : null}
    </View>
);
