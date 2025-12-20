import { convertFromMicroUnits } from '@budgie/contracts';
import { Text } from 'react-native';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS, IconName } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly label: string;
    readonly amount: bigint;
    readonly icon: IconName;
    readonly variant: ColorPaletteVariant;
}

export const TransactionAnalyticsCard = ({ label, icon, variant, amount }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const format = useFormatMoney(decimalPlaces, defaultInstrument.code);

    return (
        <Card className="flex-1 items-center p-[16px]">
            <CircleIcon border={false} className="mb-lg" icon={ICONS[icon]} variant={variant} />

            <Text className="text-xs text-secondary-foreground">{label}</Text>

            <Text className="text-primary text-md">{format(convertFromMicroUnits(amount))}</Text>
        </Card>
    );
};
