import { ExternalSourceEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';

interface Props {
    readonly provider: ExternalSourceEnum;
    readonly title: string;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' as const };

export const InstitutionMark = ({ provider, title }: Props) => {
    const monogram = (
        <View className="size-[44px] items-center justify-center rounded-[11px] bg-surface-disc" style={CONTINUOUS_CORNERS}>
            <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="text-[20px] font-semibold text-primary">
                {title.trim().charAt(0).toLocaleUpperCase()}
            </Text>
        </View>
    );

    return <BankLogo bankProvider={provider} size={44} fallback={monogram} />;
};
