import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { isThisMonth } from 'date-fns/isThisMonth';
import { isThisYear } from 'date-fns/isThisYear';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly month: Date;
    readonly total: number | null;
}

export const YieldMonthHeader = ({ month, total }: Props) => {
    const { t } = useLingui();
    const { formatFullMonth, formatFullMonthAndYear } = useFormatDate();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const monthLabel = isThisYear(month) ? formatFullMonth(month) : formatFullMonthAndYear(month);
    const totalLabel = formatAmount(total ?? 0, symbol);
    const periodLabel = isThisMonth(month) ? t`${monthLabel} so far` : monthLabel;
    const headerLabel = isDefined(total) ? t`${periodLabel} · ${totalLabel}` : periodLabel;

    return (
        <View className="px-3xl pt-xl pb-sm">
            <Text accessibilityRole="header" className="text-[13px] font-semibold tabular-nums text-secondary-foreground">
                {headerLabel}
            </Text>
        </View>
    );
};
