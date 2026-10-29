import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { testID } from '../../../@generic/utils/test-id.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { getCategorizeInboxRowHref } from '../../utils/get-categorize-inbox-row-href.util';
import { CategorizeInboxAmount } from '../categorize-inbox-amount/categorize-inbox-amount';

import { CategorizeInboxClusterRowSelector } from './categorize-inbox-cluster-row.selector';

import type { CategorizeInboxRowInterface } from '@budgie/categorization';

interface Props {
    readonly row: CategorizeInboxRowInterface;
    readonly displayTitle: string;
}

export const CategorizeInboxClusterRow = ({ row, displayTitle }: Props) => {
    const { t } = useLingui();
    const { formatDayAndMonthAndYear } = useFormatDate();
    const { excludedTransactionIds, toggleExcluded } = useCategorizeInboxContext();

    const handleTogglePress = (): void => void toggleExcluded(row.transactionId);

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
                    className="flex-1 flex-row items-center gap-x-md"
                    hitSlop={0}
                    accessibilityRole="link"
                    {...testID(CategorizeInboxClusterRowSelector.Open, row.transactionId)}
                >
                    <View className="flex-1 gap-y-xxs">
                        <Text className="text-primary text-xs font-medium tabular-nums" numberOfLines={1}>
                            {formatDayAndMonthAndYear(row.operatedAt)}
                        </Text>
                        {isDefined(ownTitle) ? (
                            <Text className="text-secondary-foreground text-xs" numberOfLines={1}>
                                {ownTitle}
                            </Text>
                        ) : null}
                    </View>

                    <CategorizeInboxAmount
                        amount={row.amount}
                        symbol={row.instrumentSymbol}
                        isIncome={row.type === TransactionTypeEnum.INCOME}
                        className="font-medium"
                    />
                </HapticPressable>
            </Link>
        </View>
    );
};
