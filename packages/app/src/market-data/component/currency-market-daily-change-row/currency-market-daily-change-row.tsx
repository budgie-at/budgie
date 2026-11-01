import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { getMarketChangeClassName } from '../../utils/get-market-change-class-name.util';
import { getMarketChangeSign } from '../../utils/get-market-change-sign.util';

interface Props {
    readonly change: number;
    readonly testID: string;
}

const PERCENT = 100;
const PERCENT_FRACTION_DIGITS = 2;

export const CurrencyMarketDailyChangeRow = ({ change, testID }: Props) => {
    const { t } = useLingui();
    const formatPercent = useFormatDigits(PERCENT_FRACTION_DIGITS);

    const changeLabel = `${getMarketChangeSign(change)}${formatPercent(Math.abs(change * PERCENT))}%`;

    return (
        <GroupedListRow
            title={t`24h change`}
            testID={testID}
            right={<Text className={cn('text-[17px] font-semibold tabular-nums', getMarketChangeClassName(change))}>{changeLabel}</Text>}
        />
    );
};
