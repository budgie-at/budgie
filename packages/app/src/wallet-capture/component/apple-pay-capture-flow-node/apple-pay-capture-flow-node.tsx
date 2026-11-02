import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly variant: ColorPaletteVariant;
}

export const ApplePayCaptureFlowNode = ({ icon, label, variant }: Props) => (
    <View className="items-center gap-y-[4px] w-[72px]">
        <View className="h-[28px] items-center justify-center">
            <CircleIcon icon={icon} variant={variant} size={28} iconSize={16} radius={14} border={false} />
        </View>
        <Text className="min-h-[18px] text-secondary-foreground text-[13px] leading-[18px] font-medium text-center">{label}</Text>
    </View>
);
