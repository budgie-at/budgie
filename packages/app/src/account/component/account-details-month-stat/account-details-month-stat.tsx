import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly label: string;
    readonly amount: number;
    readonly icon: UserIconNameEnum;
    readonly variant: ColorPaletteVariant;
}

export const AccountDetailsMonthStat = ({ label, amount, icon, variant }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    return (
        <View className="flex-1 flex-row items-center gap-x-md min-w-0">
            <CircleIcon border={false} icon={icon} variant={variant} size={32} iconSize={16} radius={16} />

            <View className="flex-1 min-w-0 gap-y-xxs">
                <Text className="uppercase tracking-wider text-secondary-foreground text-xxs" numberOfLines={1}>
                    {label}
                </Text>
                <ProtectedText adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7} className="text-primary text-lg font-semibold">
                    {formatDigits(amount, defaultInstrument.symbol)}
                </ProtectedText>
            </View>
        </View>
    );
};
