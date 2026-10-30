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
    const summary = isDefined(total) ? `${group.rows.length} · ${amountLabel(total, defaultInstrument.symbol)}` : `${group.rows.length}`;
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
                <Text className="text-positive-action text-[13px] font-semibold">{toggleLabel}</Text>
            </HapticPressable>
        ) : null;

    return (
        <View className="min-h-[32px] flex-row items-center justify-between gap-x-md px-3xl pb-sm pt-5xl">
            <Text className="text-primary shrink text-[13px] font-semibold" numberOfLines={1}>
                {formatFullMonthAndYear(group.month)}
                <Text className="text-secondary-foreground font-normal tabular-nums">{` · ${summary}`}</Text>
            </Text>
            {toggle}
        </View>
    );
};
