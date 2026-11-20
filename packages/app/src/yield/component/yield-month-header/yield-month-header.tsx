import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { isThisYear } from 'date-fns/isThisYear';
import { Text, View } from 'react-native';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly month: Date;
    readonly total: number;
}

export const YieldMonthHeader = ({ month, total }: Props) => {
    const { t } = useLingui();
    const { formatFullMonth, formatFullMonthAndYear } = useFormatDate();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const monthLabel = isThisYear(month) ? formatFullMonth(month) : formatFullMonthAndYear(month);
    const totalLabel = formatAmount(total, symbol);

    return (
        <View className="px-3xl pt-xl pb-sm">
            <Text accessibilityRole="header" className="text-[15px] font-semibold tabular-nums text-secondary-foreground">
                {t`${monthLabel} · ${totalLabel} earned`}
            </Text>
        </View>
    );
};
