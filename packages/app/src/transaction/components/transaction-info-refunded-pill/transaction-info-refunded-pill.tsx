import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useRefundedLabel } from '../../hook/use-refunded-label.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly onPress?: () => void;
    readonly testID: string;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const TransactionInfoRefundedPill = ({ transaction, onPress, testID }: Props) => {
    const label = useRefundedLabel(transaction);

    if (!isDefined(label)) {
        return null;
    }

    return (
        <HapticPressable
            accessible
            accessibilityRole="button"
            accessibilityLabel={label}
            disabled={!isDefined(onPress)}
            onPress={onPress}
            testID={testID}
            className="min-h-[44px] justify-center active:scale-100 active:opacity-70"
        >
            <View className="flex-row items-center gap-x-xs rounded-full bg-surface-row px-lg py-xs" style={continuousCorners}>
                <Icon icon={UserIconNameEnum.RotateCcw} size={13} className="text-secondary-foreground" />
                <Text className="text-[13px] leading-[18px] text-secondary-foreground font-medium" numberOfLines={1}>
                    {label}
                </Text>
            </View>
        </HapticPressable>
    );
};
