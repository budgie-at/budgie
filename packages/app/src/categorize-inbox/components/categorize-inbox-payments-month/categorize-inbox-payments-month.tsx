import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';
import { getCategorizeInboxDefaultAmount } from '../../utils/get-categorize-inbox-default-amount.util';
import { CategorizeInboxClusterRow } from '../categorize-inbox-cluster-row/categorize-inbox-cluster-row';

import type { CategorizeInboxMonthGroupInterface } from '../../interface/categorize-inbox-month-group.interface';

interface Props {
    readonly group: CategorizeInboxMonthGroupInterface;
    readonly displayTitle: string;
}

export const CategorizeInboxPaymentsMonth = ({ group, displayTitle }: Props) => {
    const { formatFullMonthAndYear } = useFormatDate();
    const amountLabel = useCategorizeInboxAmountLabel();

    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const total = getCategorizeInboxDefaultAmount(group.rows, defaultInstrument);
    const summary = isDefined(total) ? `${group.rows.length} · ${amountLabel(total, defaultInstrument.symbol)}` : `${group.rows.length}`;

    return (
        <View>
            <View className="flex-row items-baseline justify-between gap-x-md pb-sm pt-3xl">
                <Text className="text-secondary-foreground text-xs font-semibold uppercase" numberOfLines={1}>
                    {formatFullMonthAndYear(group.month)}
                </Text>
                <Text className="text-secondary-foreground text-xs tabular-nums" numberOfLines={1}>
                    {summary}
                </Text>
            </View>

            {group.rows.map(row => (
                <CategorizeInboxClusterRow key={row.transactionId} row={row} displayTitle={displayTitle} />
            ))}
        </View>
    );
};
