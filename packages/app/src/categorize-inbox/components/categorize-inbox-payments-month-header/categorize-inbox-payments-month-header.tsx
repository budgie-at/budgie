import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text } from 'react-native';

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
import { CategorizeInboxSelectionIndicator } from '../categorize-inbox-selection-indicator/categorize-inbox-selection-indicator';

import { CategorizeInboxPaymentsMonthHeaderSelector } from './categorize-inbox-payments-month-header.selector';

import type { CategorizeInboxMonthGroupInterface } from '../../interface/categorize-inbox-month-group.interface';

interface Props {
    readonly group: CategorizeInboxMonthGroupInterface;
}

export const CategorizeInboxPaymentsMonthHeader = ({ group }: Props) => {
    const { formatFullMonthAndYear } = useFormatDate();
    const amountLabel = useCategorizeInboxAmountLabel();
    const { excludedTransactionIds, setExcluded } = useCategorizeInboxContext();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const total = getCategorizeInboxDefaultAmount(group.rows, defaultInstrument);
    const summary = isDefined(total) ? `${group.rows.length} · ${amountLabel(total, defaultInstrument.symbol)}` : `${group.rows.length}`;
    const monthLabel = formatFullMonthAndYear(group.month);

    const selection = getCategorizeInboxSelection(group.rows, excludedTransactionIds);
    const isAllIncluded = selection === CategorizeInboxSelectionEnum.INCLUDED;
    const checked: boolean | 'mixed' = selection === CategorizeInboxSelectionEnum.PARTIAL ? 'mixed' : isAllIncluded;
    const accessibilityState = { checked };

    const handleTogglePress = (): void =>
        void setExcluded(
            group.rows.map(row => row.transactionId),
            isAllIncluded
        );

    return (
        <HapticPressable
            onPress={handleTogglePress}
            className="flex-row items-center justify-between gap-x-md pb-sm pt-3xl"
            accessibilityRole="checkbox"
            accessibilityState={accessibilityState}
            accessibilityLabel={`${monthLabel}, ${summary}`}
            {...testID(CategorizeInboxPaymentsMonthHeaderSelector.Toggle, group.month.getTime())}
        >
            <Text className="text-secondary-foreground flex-1 text-xs font-semibold uppercase" numberOfLines={1}>
                {monthLabel}
            </Text>
            <Text className="text-secondary-foreground text-xs tabular-nums" numberOfLines={1}>
                {summary}
            </Text>
            <CategorizeInboxSelectionIndicator selection={selection} />
        </HapticPressable>
    );
};
