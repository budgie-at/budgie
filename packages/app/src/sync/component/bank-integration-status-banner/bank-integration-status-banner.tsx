import { UserIconNameEnum } from '@budgie/contracts';
import { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';

interface Props extends PropsWithChildren {
    readonly text: string;
    readonly variant: Extract<ColorPaletteVariant, 'destructive' | 'warning'>;
    readonly testID: string;
}

export const BankIntegrationStatusBanner = ({ text, variant, testID, children }: Props) => {
    const colorClassName = FOREGROUND_COLOR_PALETTE[variant];

    return (
        <View className="flex-row items-center gap-x-sm px-lg py-md bg-secondary-background rounded-xl" testID={testID}>
            <Icon icon={UserIconNameEnum.TriangleAlert} size={14} className={cn(colorClassName)} />
            <Text className={cn('flex-1 text-xs font-medium', colorClassName)}>{text}</Text>
            {children}
        </View>
    );
};
