import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly total: number;
    readonly children: ReactNode;
}

export const AccountSectionHeaderFrame = ({ total, children }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useDisplayFormatDigits();

    const formattedTotal = formatDigits(total, defaultInstrument.symbol);

    return (
        <View className="bg-primary-reverse py-md -mx-5xl px-5xl flex-row justify-between items-center">
            {children}
            <Text className="text-xs text-secondary-foreground">{formattedTotal}</Text>
        </View>
    );
};
