import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useFormatPercent } from '../../../i18n/hook/use-format-percent.hook';

interface Props {
    readonly current: number;
    readonly previous: number;
    readonly previousLabel: string;
}

export const StatisticsChangeLabel = ({ current, previous, previousLabel }: Props) => {
    const { t } = useLingui();
    const isAmountProtected = useIsAmountProtected();
    const formatPercent = useFormatPercent();

    const change = (current - previous) / previous;
    const isIncrease = change >= 0;
    const changeArrow = isIncrease ? '↑' : '↓';
    const changePercent = isAmountProtected ? '••%' : formatPercent(Math.abs(change));
    const changeLabel = isIncrease ? t`${changePercent} more than ${previousLabel}` : t`${changePercent} less than ${previousLabel}`;

    return (
        <Text accessibilityLabel={changeLabel} className="text-sm text-secondary-foreground">
            {`${changeArrow} ${changeLabel}`}
        </Text>
    );
};
