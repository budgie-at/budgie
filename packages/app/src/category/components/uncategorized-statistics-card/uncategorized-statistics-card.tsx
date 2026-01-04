/* jscpd:ignore-start */
import { TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { StatsBar } from '../../../@generic/component/stats-bar/stats-bar';
import { statsAmountVariants } from '../../../@generic/constant/stats-variants.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly amount: number;
    readonly percentage: number;
    readonly variant: ColorPaletteVariant;
    readonly filters: TransactionFilterInterface;
    readonly isIncome: boolean;
}

export const UncategorizedStatisticsCard = ({ amount, percentage, variant, filters, isIncome }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const router = useRouter();
    const { t } = useLingui();

    const microAmount = convertFromMicroUnits(amount);
/* jscpd:ignore-end */

    /* jscpd:ignore-start */
    const handlePress = () => {
        router.push({
            pathname: '/analytics/transactions',
            params: {
                type: isIncome ? 'INCOME' : 'EXPENSE',
                ...(filters.date?.from && { startDate: filters.date.from.toISOString() }),
                ...(filters.date?.to && { endDate: filters.date.to.toISOString() })
            }
        });
    };

    return (
        <HapticPressable onPress={handlePress} className="gap-y-md">
            <View className="flex-row items-center gap-x-md">
                <CircleIcon icon={UserIconNameEnum.BadgeQuestionMark} variant={variant} />
                <Text className="mr-auto text-primary text-xs">{t`Uncategorized`}</Text>
                <Text className={statsAmountVariants({ variant })}>{formatDigits(microAmount, defaultInstrument.symbol)}</Text>
            </View>

            <StatsBar percentage={percentage} variant={variant} />

            <Text className="text-secondary-foreground">
                {isIncome ? t`${percentage}% of income` : t`${percentage}% of expenses`}
            </Text>
        </HapticPressable>
    );
    /* jscpd:ignore-end */
};
