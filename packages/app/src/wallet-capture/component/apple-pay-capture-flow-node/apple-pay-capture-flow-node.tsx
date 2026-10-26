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
    <View className="items-center gap-y-sm w-[72px]">
        <CircleIcon icon={icon} variant={variant} size={40} iconSize={18} radius={20} />
        <Text className="text-secondary-foreground text-xs font-medium text-center" numberOfLines={1}>
            {label}
        </Text>
    </View>
);
