import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { StickySectionHeaderBackdrop } from '../../../@generic/component/sticky-section-header-backdrop/sticky-section-header-backdrop';
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
        <View className="py-md -mx-3xl px-3xl flex-row justify-between items-center">
            <StickySectionHeaderBackdrop />
            {children}
            <Text className="text-xs text-secondary-foreground">{formattedTotal}</Text>
        </View>
    );
};
