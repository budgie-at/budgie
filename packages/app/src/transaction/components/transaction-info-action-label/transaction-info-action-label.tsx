import { Text, View, useWindowDimensions } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { TRANSACTION_INFO_ROW_MAX_FONT_SCALE } from '../../constant/transaction-info-row-max-font-scale.constant';
import { TRANSACTION_INFO_STACKED_FONT_SCALE } from '../../constant/transaction-info-stacked-font-scale.constant';

import type { UserIconType } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly icon: UserIconType;
    readonly label: string;
    readonly colorClassName?: string;
    readonly children?: ReactNode;
}

export const TransactionInfoActionLabel = ({ icon, label, colorClassName = 'text-default-foreground', children }: Props) => {
    const { fontScale } = useWindowDimensions();
    const largeText = fontScale > TRANSACTION_INFO_STACKED_FONT_SCALE;
    const separatorClassName = largeText ? 'left-3xl' : 'left-[56px]';
    const iconSize = 22 * fontScale;

    return (
        <View className="min-h-[44px] flex-row items-center gap-x-xl px-3xl py-md" collapsable={false}>
            <View className={cn('absolute top-0 right-0 h-hairline bg-surface-separator', separatorClassName)} pointerEvents="none" />
            {largeText ? null : (
                <View className="w-[28px] items-center">
                    <Icon icon={icon} size={iconSize} className={colorClassName} />
                </View>
            )}
            <Text
                maxFontSizeMultiplier={TRANSACTION_INFO_ROW_MAX_FONT_SCALE}
                className={cn('flex-1 text-[17px] leading-[22px]', colorClassName)}
            >
                {label}
            </Text>
            {children}
        </View>
    );
};
