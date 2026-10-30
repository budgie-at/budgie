import { TransactionTypeEnum } from '@budgie/contracts';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { testID } from '../../../@generic/utils/test-id.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';
import { getCategorizeInboxRowHref } from '../../utils/get-categorize-inbox-row-href.util';
import { CategorizeInboxAmount } from '../categorize-inbox-amount/categorize-inbox-amount';
import { CategorizeInboxSelectionIndicator } from '../categorize-inbox-selection-indicator/categorize-inbox-selection-indicator';

import { CategorizeInboxClusterRowSelector } from './categorize-inbox-cluster-row.selector';

import type { CategorizeInboxRowInterface } from '@budgie/categorization';

interface Props {
    readonly row: CategorizeInboxRowInterface;
    readonly displayTitle: string;
}

export const CategorizeInboxClusterRow = ({ row, displayTitle }: Props) => {
    const router = useRouter();
    const { formatWeekdayAndDay, formatTime } = useFormatDate();
    const amountLabel = useCategorizeInboxAmountLabel();
    const { excludedTransactionIds, toggleExcluded } = useCategorizeInboxContext();

    const handleTogglePress = (): void => void toggleExcluded(row.transactionId);
    const handleOpenLongPress = (): void => void router.push(getCategorizeInboxRowHref(row));

    const isIncluded = !excludedTransactionIds.has(row.transactionId);
    const accessibilityState = { checked: isIncluded };
    const contentClassName = isIncluded
        ? 'min-w-0 flex-1 flex-row items-center gap-x-md'
        : 'min-w-0 flex-1 flex-row items-center gap-x-md opacity-40';
    const ownTitleLine =
        row.title === displayTitle ? null : (
            <Text className="text-secondary-foreground text-[13px]" numberOfLines={1}>
                {row.title}
            </Text>
        );
    const date = formatWeekdayAndDay(row.operatedAt);
    const time = formatTime(row.operatedAt);
    const accessibilityLabel = `${date}, ${time}, ${amountLabel(row.amount, row.instrumentSymbol)}`;

    return (
        <HapticPressable
            onPress={handleTogglePress}
            onLongPress={handleOpenLongPress}
            className="min-h-[52px] flex-row items-center gap-x-xl px-3xl py-xl active:opacity-70"
            accessibilityRole="checkbox"
            accessibilityState={accessibilityState}
            accessibilityLabel={accessibilityLabel}
            {...testID(CategorizeInboxClusterRowSelector.Row, row.transactionId)}
        >
            <View className="absolute top-0 right-0 left-[64px] h-hairline bg-surface-separator" pointerEvents="none" />
            <View className="w-[36px] items-center">
                <CategorizeInboxSelectionIndicator variant="positive" isSelected={isIncluded} />
            </View>

            <View className={contentClassName}>
                <View className="min-w-0 flex-1">
                    <Text className="text-primary text-[17px] tabular-nums" numberOfLines={1}>
                        {date}
                        <Text className="text-secondary-foreground">{` · ${time}`}</Text>
                    </Text>
                    {ownTitleLine}
                </View>

                <CategorizeInboxAmount
                    amount={row.amount}
                    symbol={row.instrumentSymbol}
                    isIncome={row.type === TransactionTypeEnum.INCOME}
                    className="text-[17px]"
                />
            </View>
        </HapticPressable>
    );
};
