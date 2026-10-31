import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
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

import { CategorizeInboxPaymentsMonthHeaderSelector } from './categorize-inbox-payments-month-header.selector';

import type { CategorizeInboxMonthGroupInterface } from '../../interface/categorize-inbox-month-group.interface';

interface Props {
    readonly group: CategorizeInboxMonthGroupInterface;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 8, right: 8 };

export const CategorizeInboxPaymentsMonthHeader = ({ group }: Props) => {
    const { formatFullMonthAndYear } = useFormatDate();
    const amountLabel = useCategorizeInboxAmountLabel();
    const { excludedTransactionIds, setExcluded } = useCategorizeInboxContext();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const total = getCategorizeInboxDefaultAmount(group.rows, defaultInstrument);
    const totalLabel = isDefined(total) ? amountLabel(total, defaultInstrument.symbol) : '';
    const isAllIncluded = getCategorizeInboxSelection(group.rows, excludedTransactionIds) === CategorizeInboxSelectionEnum.INCLUDED;
    const toggleLabel = isAllIncluded ? <Trans>Deselect all</Trans> : <Trans>Select all</Trans>;

    const handleTogglePress = (): void =>
        void setExcluded(
            group.rows.map(row => row.transactionId),
            isAllIncluded
        );

    const toggle =
        group.rows.length > 1 ? (
            <HapticPressable
                onPress={handleTogglePress}
                accessibilityRole="button"
                hitSlop={HIT_SLOP}
                {...testID(CategorizeInboxPaymentsMonthHeaderSelector.Toggle, group.month.getTime())}
            >
                <Text className="text-primary text-[15px]">{toggleLabel}</Text>
            </HapticPressable>
        ) : null;

    return (
        <View className="min-h-[44px] flex-row items-center gap-x-xl px-3xl pb-xs pt-xl">
            <View className="absolute top-0 right-0 left-0 h-hairline bg-surface-separator" pointerEvents="none" />
            <Text className="text-primary min-w-0 flex-1 text-[15px] font-semibold" numberOfLines={1} accessibilityRole="header">
                {formatFullMonthAndYear(group.month)}
            </Text>
            {toggle}
            <Text className="text-secondary-foreground shrink-0 text-[15px] tabular-nums" numberOfLines={1}>
                {totalLabel}
            </Text>
        </View>
    );
};
