import { useAtomValue } from '@effect/atom-react/Hooks';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { StickySectionHeaderBackdrop } from '../../../@generic/component/sticky-section-header-backdrop/sticky-section-header-backdrop';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom, defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly total: number;
    readonly children: ReactNode;
    readonly footer?: ReactNode;
}

export const AccountSectionHeaderFrame = ({ total, children, footer }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useFormatDigits(useAtomValue(decimalPlacesAtom));

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
