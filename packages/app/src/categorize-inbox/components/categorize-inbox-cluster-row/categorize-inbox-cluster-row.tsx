import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
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
    const router = useRouter();
    const { formatWeekdayMonthAndDay } = useFormatDate();
    const { excludedTransactionIds, toggleExcluded } = useCategorizeInboxContext();

    const handleTogglePress = (): void => void toggleExcluded(row.transactionId);
    const handleOpenLongPress = (): void => void router.push(getCategorizeInboxRowHref(row));

    const isIncluded = !excludedTransactionIds.has(row.transactionId);
    const rowClassName = isIncluded
        ? 'border-t-hairline border-secondary-corner flex-row items-center gap-x-md py-md'
        : 'border-t-hairline border-secondary-corner flex-row items-center gap-x-md py-md opacity-40';
    const selectionIcon = isIncluded ? UserIconNameEnum.CircleCheck : UserIconNameEnum.Circle;
    const selectionClassName = isIncluded ? 'text-primary' : 'text-secondary-foreground';
    const accessibilityState = { checked: isIncluded };
    const ownTitle = row.title === displayTitle ? null : row.title;

    return (
        <HapticPressable
            onPress={handleTogglePress}
            onLongPress={handleOpenLongPress}
            className={rowClassName}
            accessibilityRole="checkbox"
            accessibilityState={accessibilityState}
            accessibilityLabel={t`Include in bulk action`}
            {...testID(CategorizeInboxClusterRowSelector.Row, row.transactionId)}
        >
            <View className="flex-1 gap-y-xxs">
                <Text className="text-primary text-sm tabular-nums" numberOfLines={1}>
                    {formatWeekdayMonthAndDay(row.operatedAt)}
                </Text>
                {isDefined(ownTitle) ? (
                    <Text className="text-secondary-foreground text-xs" numberOfLines={1}>
                        {ownTitle}
                    </Text>
                ) : null}
            </View>

            <CategorizeInboxAmount amount={row.amount} symbol={row.instrumentSymbol} isIncome={row.type === TransactionTypeEnum.INCOME} />

            <Icon icon={selectionIcon} size={22} className={selectionClassName} />
        </HapticPressable>
    );
};
