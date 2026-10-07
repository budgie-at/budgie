import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { getCategorizeInboxRowHref } from '../../utils/get-categorize-inbox-row-href.util';

import { CategorizeInboxClusterRowSelector } from './categorize-inbox-cluster-row.selector';

import type { CategorizeInboxRowInterface } from '@budgie/categorization';

interface Props {
    readonly row: CategorizeInboxRowInterface;
    readonly displayTitle: string;
}

export const CategorizeInboxClusterRow = ({ row, displayTitle }: Props) => {
    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();
    const { formatDayAndMonthAndYear } = useFormatDate();
    const { strategy, excludedTransactionIds, toggleExcluded, pickRowLabels } = useCategorizeInboxContext();

    const handleTogglePress = (): void => void toggleExcluded(row.transactionId);
    const handlePickLabelsPress = (): void => void pickRowLabels(row);

    const isIncluded = !excludedTransactionIds.has(row.transactionId);
    const rowClassName = isIncluded ? 'flex-row items-center gap-x-xs' : 'flex-row items-center gap-x-xs opacity-40';
    const checkboxIcon = isIncluded ? UserIconNameEnum.SquareCheck : UserIconNameEnum.Square;
    const accessibilityState = { checked: isIncluded };
    const ownTitle = row.title === displayTitle ? null : row.title;

    return (
        <View className={rowClassName} {...testID(CategorizeInboxClusterRowSelector.Row, row.transactionId)}>
            <HapticPressable
                onPress={handleTogglePress}
                className="h-11 w-11 items-center justify-center"
                accessibilityRole="checkbox"
                accessibilityState={accessibilityState}
                accessibilityLabel={t`Include in bulk action`}
                {...testID(CategorizeInboxClusterRowSelector.Checkbox, row.transactionId)}
            >
                <Icon icon={checkboxIcon} size={20} className="text-primary" />
            </HapticPressable>

            <Link href={getCategorizeInboxRowHref(row)} asChild>
                <HapticPressable
                    className="flex-1 flex-row items-center gap-x-xs"
                    hitSlop={0}
                    accessibilityRole="link"
                    accessibilityLabel={t`Open transaction`}
                    {...testID(CategorizeInboxClusterRowSelector.Open, row.transactionId)}
                >
                    <View className="flex-1 gap-y-xxs">
                        {isDefined(ownTitle) ? (
                            <Text className="text-primary text-sm" numberOfLines={1}>
                                {ownTitle}
                            </Text>
                        ) : null}
                        <Text className="text-secondary-foreground text-xs">{formatDayAndMonthAndYear(row.operatedAt)}</Text>
                    </View>

                    <Text className="text-primary text-sm font-medium">
                        {protectAmount(convertFromMicroUnits(row.amount), row.instrumentSymbol)}
                    </Text>
                </HapticPressable>
            </Link>

            <HapticPressable
                onPress={handlePickLabelsPress}
                className="h-11 w-11 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel={strategy.pickRowLabel}
                {...testID(CategorizeInboxClusterRowSelector.PickCategory, row.transactionId)}
            >
                <Icon icon={UserIconNameEnum.EllipsisVertical} size={16} className="text-secondary-foreground" />
            </HapticPressable>
        </View>
    );
};
