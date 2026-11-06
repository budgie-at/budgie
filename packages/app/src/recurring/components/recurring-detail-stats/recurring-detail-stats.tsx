import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

import type { RecurringHistoryItemInterface } from '@budgie/recurring';

interface Props {
    readonly history: readonly RecurringHistoryItemInterface[];
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const RecurringDetailStats = ({ history }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const { formatMonthAndYear } = useFormatDate();
    const paid = history.filter(item => !item.isExcluded);

    if (!isNotEmptyArray(paid)) {
        return null;
    }

    const total = protectAmount(
        convertFromMicroUnits(paid.reduce((sum, item) => sum + Math.abs(item.amount), 0)),
        defaultInstrument.symbol
    );
    const since = formatMonthAndYear(new Date(Math.min(...paid.map(item => item.operatedAt.getTime()))));
    const stats = [
        { label: t`Payments`, value: String(paid.length) },
        { label: t`Total paid`, value: total },
        { label: t`First paid`, value: since }
    ];

    return (
        <View className="flex-row rounded-3xl bg-grouped-surface-row py-xl" style={continuousCorners}>
            {stats.map(stat => (
                <View key={stat.label} className="flex-1 items-center gap-y-xxs px-sm">
                    <Text className="text-[17px] font-semibold text-primary tabular-nums" numberOfLines={1} adjustsFontSizeToFit>
                        {stat.value}
                    </Text>
                    <Text className="text-[13px] text-secondary-foreground">{stat.label}</Text>
                </View>
            ))}
        </View>
    );
};
