import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { StickySectionHeaderBackdrop } from '../../../@generic/component/sticky-section-header-backdrop/sticky-section-header-backdrop';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly total: number;
    readonly children: ReactNode;
    readonly footer?: ReactNode;
}

export const AccountSectionHeaderFrame = ({ total, children, footer }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useDisplayFormatDigits();

    const formattedTotal = formatDigits(total, defaultInstrument.symbol);

    return (
        <View className="pt-md pb-xl -mx-3xl px-3xl gap-y-md">
            <StickySectionHeaderBackdrop />
            <View className="flex-row justify-between items-center">
                {children}
                <Text className="text-xs text-secondary-foreground">{formattedTotal}</Text>
            </View>
            {footer}
        </View>
    );
};
