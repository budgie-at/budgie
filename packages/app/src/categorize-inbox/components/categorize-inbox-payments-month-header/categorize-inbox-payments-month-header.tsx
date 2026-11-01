import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { testID } from '../../../@generic/utils/test-id.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxSelectionEnum } from '../../enum/categorize-inbox-selection.enum';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';
import { getCategorizeInboxDefaultAmount } from '../../utils/get-categorize-inbox-default-amount.util';
import { getCategorizeInboxSelection } from '../../utils/get-categorize-inbox-selection.util';
import { CategorizeInboxPartialSelectionIndicator } from '../categorize-inbox-partial-selection-indicator/categorize-inbox-partial-selection-indicator';
import { CategorizeInboxSelectionIndicator } from '../categorize-inbox-selection-indicator/categorize-inbox-selection-indicator';

import { CategorizeInboxPaymentsMonthHeaderSelector } from './categorize-inbox-payments-month-header.selector';

import type { CategorizeInboxMonthGroupInterface } from '../../interface/categorize-inbox-month-group.interface';
import type { ReactElement } from 'react';
import type { AccessibilityState } from 'react-native';

interface Props {
    readonly group: CategorizeInboxMonthGroupInterface;
}

const CHECKED_STATES: Record<CategorizeInboxSelectionEnum, AccessibilityState['checked']> = {
    [CategorizeInboxSelectionEnum.INCLUDED]: true,
    [CategorizeInboxSelectionEnum.EXCLUDED]: false,
    [CategorizeInboxSelectionEnum.PARTIAL]: 'mixed'
};

export const CategorizeInboxPaymentsMonthHeader = ({ group }: Props) => {
    const { formatFullMonthAndYear } = useFormatDate();
    const amountLabel = useCategorizeInboxAmountLabel();
    const { excludedTransactionIds, setExcluded } = useCategorizeInboxContext();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const total = getCategorizeInboxDefaultAmount(group.rows, defaultInstrument);
    const totalLabel = isDefined(total) ? amountLabel(total, defaultInstrument.symbol) : '';
    const monthLabel = formatFullMonthAndYear(group.month);
    const selection = getCategorizeInboxSelection(group.rows, excludedTransactionIds);
    const isAllIncluded = selection === CategorizeInboxSelectionEnum.INCLUDED;
    const indicators: Record<CategorizeInboxSelectionEnum, ReactElement> = {
        [CategorizeInboxSelectionEnum.INCLUDED]: <CategorizeInboxSelectionIndicator isSelected />,
        [CategorizeInboxSelectionEnum.EXCLUDED]: <CategorizeInboxSelectionIndicator isSelected={false} />,
        [CategorizeInboxSelectionEnum.PARTIAL]: <CategorizeInboxPartialSelectionIndicator />
    };
    const accessibilityState = { checked: CHECKED_STATES[selection] };

    const handleTogglePress = (): void =>
        void setExcluded(
            group.rows.map(row => row.transactionId),
            isAllIncluded
        );

    return (
        <HapticPressable
            onPress={handleTogglePress}
            className="min-h-[44px] flex-row items-center gap-x-xl px-3xl pb-xs pt-xl active:opacity-70"
            accessibilityRole="checkbox"
            accessibilityState={accessibilityState}
            accessibilityLabel={monthLabel}
            {...testID(CategorizeInboxPaymentsMonthHeaderSelector.Toggle, group.month.getTime())}
        >
            <View className="absolute top-0 right-0 left-0 h-hairline bg-surface-separator" pointerEvents="none" />
            <Text className="text-primary min-w-0 flex-1 text-[15px] font-semibold" numberOfLines={1}>
                {monthLabel}
            </Text>
            <Text className="text-secondary-foreground shrink-0 text-[15px] tabular-nums" numberOfLines={1}>
                {totalLabel}
            </Text>
            {indicators[selection]}
        </HapticPressable>
    );
};
