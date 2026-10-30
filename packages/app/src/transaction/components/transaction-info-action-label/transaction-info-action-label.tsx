import { Text, View, useWindowDimensions } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { TRANSACTION_INFO_STACKED_FONT_SCALE } from '../../constant/transaction-info-stacked-font-scale.constant';

import type { UserIconType } from '@budgie/contracts';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

interface Props {
    readonly icon: UserIconType;
    readonly label: string;
    readonly style?: StyleProp<ViewStyle>;
    readonly children?: ReactNode;
}

export const TransactionInfoActionLabel = ({ icon, label, style, children }: Props) => {
    const { fontScale } = useWindowDimensions();
    const iconSize = 22 * Math.min(fontScale, TRANSACTION_INFO_STACKED_FONT_SCALE);

    return (
        <View className="min-h-[44px] flex-row items-center gap-x-xl px-3xl py-md" style={style} collapsable={false}>
            <View className="absolute top-0 right-0 left-[56px] h-hairline bg-surface-separator" pointerEvents="none" />
            <View className="w-[28px] items-center">
                <Icon icon={icon} size={iconSize} className="text-default-foreground" />
            </View>
            <Text className="flex-1 text-[17px] leading-[22px] text-default-foreground">{label}</Text>
            {children}
        </View>
    );
};
