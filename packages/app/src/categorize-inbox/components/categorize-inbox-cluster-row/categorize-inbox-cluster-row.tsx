import { TransactionTypeEnum } from '@budgie/contracts';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { testID } from '../../../@generic/utils/test-id.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxSelectionEnum } from '../../enum/categorize-inbox-selection.enum';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';
import { getCategorizeInboxRowHref } from '../../utils/get-categorize-inbox-row-href.util';
import { CategorizeInboxAmount } from '../categorize-inbox-amount/categorize-inbox-amount';
import { CategorizeInboxSelectionIndicator } from '../categorize-inbox-selection-indicator/categorize-inbox-selection-indicator';

import { CategorizeInboxClusterRowSelector } from './categorize-inbox-cluster-row.selector';

import type { CategorizeInboxRowInterface } from '@budgie/categorization';
import type { ReactNode } from 'react';

interface Props {
    readonly row: CategorizeInboxRowInterface;
    readonly displayTitle: string;
    readonly leading: ReactNode;
}

export const CategorizeInboxClusterRow = ({ row, displayTitle, leading }: Props) => {
    const router = useRouter();
    const { formatWeekdayMonthAndDay, formatTime } = useFormatDate();
    const amountLabel = useCategorizeInboxAmountLabel();
    const { excludedTransactionIds, toggleExcluded } = useCategorizeInboxContext();

    const handleTogglePress = (): void => void toggleExcluded(row.transactionId);
    const handleOpenLongPress = (): void => void router.push(getCategorizeInboxRowHref(row));

    const isIncluded = !excludedTransactionIds.has(row.transactionId);
    const contentClassName = isIncluded ? 'flex-1 flex-row items-center gap-x-md' : 'flex-1 flex-row items-center gap-x-md opacity-40';
    const selection = isIncluded ? CategorizeInboxSelectionEnum.INCLUDED : CategorizeInboxSelectionEnum.EXCLUDED;
    const accessibilityState = { checked: isIncluded };
    const ownTitle = row.title === displayTitle ? null : row.title;
    const time = formatTime(row.operatedAt);
    const accessibilityLabel = `${formatWeekdayMonthAndDay(row.operatedAt)}, ${time}, ${amountLabel(row.amount, row.instrumentSymbol)}`;

    return (
        <HapticPressable
            onPress={handleTogglePress}
            onLongPress={handleOpenLongPress}
            className="flex-row items-center gap-x-md py-md active:bg-secondary-background"
            accessibilityRole="checkbox"
            accessibilityState={accessibilityState}
            accessibilityLabel={accessibilityLabel}
            {...testID(CategorizeInboxClusterRowSelector.Row, row.transactionId)}
        >
            <View className={contentClassName}>
                <View className="w-[44px]">{leading}</View>

                <View className="flex-1">
                    <Text className="text-secondary-foreground text-sm tabular-nums" numberOfLines={1}>
                        {time}
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
                />
            </View>

            <CategorizeInboxSelectionIndicator selection={selection} />
        </HapticPressable>
    );
};
