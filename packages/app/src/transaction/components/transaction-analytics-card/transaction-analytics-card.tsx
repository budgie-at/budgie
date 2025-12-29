import { Text } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { IconName } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';

interface Props {
    readonly label: string;
    readonly amount: number;
    readonly icon: IconName;
    readonly variant: ColorPaletteVariant;
}

export const TransactionAnalyticsCard = ({ label, icon, variant, amount }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    return (
        <Card className="flex-1 items-center p-[16px]">
            <CircleIcon border={false} className="mb-lg" icon={icon} variant={variant} />

            <Text className="text-xs text-secondary-foreground">{label}</Text>

            <ProtectedText className="text-primary text-md">{formatDigits(amount, defaultInstrument.symbol)}</ProtectedText>
        </Card>
    );
};
