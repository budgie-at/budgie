/* jscpd:ignore-start */
import { TagEntityInterface, TransactionFilterInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { StatsBar } from '../../../@generic/component/stats-bar/stats-bar';
import { statsAmountVariants } from '../../../@generic/constant/stats-variants.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { AnalyticsTransactionsModeEnum } from '../../../transaction/enum/analytics-transactions-mode.enum';
import { buildUncategorizedRouteParams } from '../../../transaction/utils/build-uncategorized-route-params.util';

import { TagStatisticsCardSelector } from './tag-statistics-card.selector';

interface Props {
    readonly tag: Pick<TagEntityInterface, 'title'> & { id: TagEntityInterface['id'] | null };
    readonly amount: number;
    readonly percentage: number;
    readonly variant: ColorPaletteVariant;
    readonly filters: TransactionFilterInterface;
    readonly isIncome: boolean;
}

export const TagStatisticsCard = ({ tag, amount, percentage, variant, filters, isIncome }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const router = useRouter();

    const microAmount = convertFromMicroUnits(amount);
    const cardTestID = TagStatisticsCardSelector.Card(tag.title);
    const amountTestID = TagStatisticsCardSelector.Amount(tag.title, amount);
    /* jscpd:ignore-end */

    /* jscpd:ignore-start */
    const handlePress = () => {
        const type = isIncome ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE;
        const params = isDefined(tag.id)
            ? {
                  type,
                  tagId: String(tag.id),
                  ...(filters.date?.from && { startDate: filters.date.from.toISOString() }),
                  ...(filters.date?.to && { endDate: filters.date.to.toISOString() })
              }
            : buildUncategorizedRouteParams({ ...filters, types: [type] }, AnalyticsTransactionsModeEnum.TAG_INBOX);

        router.push({ pathname: '/analytics/transactions', params });
    };

    return (
        <HapticPressable onPress={handlePress} className="gap-y-md" testID={cardTestID}>
            <View className="flex-row items-center gap-x-md">
                <Text className="mr-auto text-primary text-xs">{tag.title}</Text>
                <Text className={statsAmountVariants({ variant })} testID={amountTestID}>
                    {formatDigits(microAmount, defaultInstrument.symbol)}
                </Text>
            </View>

            <StatsBar percentage={percentage} variant={variant} />

            <Text className="text-secondary-foreground">{isIncome ? t`${percentage}% of income` : t`${percentage}% of expenses`}</Text>
        </HapticPressable>
    );
    /* jscpd:ignore-end */
};
