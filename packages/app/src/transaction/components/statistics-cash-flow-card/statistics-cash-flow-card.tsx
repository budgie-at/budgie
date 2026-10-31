import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useGetTotalIncomeAndExpensesQuery } from '../../query/use-get-total-income-and-expenses.query';
import { StatisticsHeroFigureRow } from '../statistics-hero-figure-row/statistics-hero-figure-row';

import type { TransactionFilterInterface } from '@budgie/contracts';

interface Props {
    readonly filters: TransactionFilterInterface;
}

const AMOUNT_STYLE = { fontVariant: ['tabular-nums' as const] };
const continuousCorners = { borderCurve: 'continuous' as const };

export const StatisticsCashFlowCard = ({ filters }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();
    const { expense, income } = useGetTotalIncomeAndExpensesQuery(filters);

    const net = income - expense;
    const netSign = net > 0 ? '+' : '';
    const incomeSign = income > 0 ? '+' : '';

    return (
        <View className="gap-y-xs rounded-3xl bg-grouped-surface-row px-3xl py-lg" style={continuousCorners}>
            <StatisticsHeroFigureRow label={t`Income`}>
                <ProtectedText style={AMOUNT_STYLE} className="text-[15px] font-medium text-positive-foreground">
                    {`${incomeSign}${formatDigits(income, defaultInstrument.symbol)}`}
                </ProtectedText>
            </StatisticsHeroFigureRow>

            <View className="h-hairline bg-surface-separator" />

            <StatisticsHeroFigureRow label={t`Net`}>
                <ProtectedText style={AMOUNT_STYLE} className="text-[15px] font-medium text-primary">
                    {`${netSign}${formatDigits(net, defaultInstrument.symbol)}`}
                </ProtectedText>
            </StatisticsHeroFigureRow>
        </View>
    );
};
