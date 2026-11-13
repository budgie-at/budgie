import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import { Text } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatGainPercent } from '../../../i18n/hook/use-format-gain-percent.hook';
import { getMarketChangeSign } from '../../utils/get-market-change-sign.util';
import { getMarketMoveClassName } from '../../utils/get-market-move-class-name.util';
import { isMarketPriceStale } from '../../utils/is-market-price-stale.util';

interface Props {
    readonly change: number;
    readonly priceDate: string;
    readonly testID: string;
}

export const CurrencyMarketDailyChangeRow = ({ change, priceDate, testID }: Props) => {
    const { t } = useLingui();
    const formatPercent = useFormatGainPercent();
    const { formatMonthAndDay } = useFormatDate();

    const staleDate = formatMonthAndDay(parseISO(priceDate));
    const title = isMarketPriceStale(priceDate) ? t`24h change · ${staleDate}` : t`24h change`;
    const changeLabel = `${getMarketChangeSign(change)}${formatPercent(change)}`;

    return (
        <GroupedListRow
            title={title}
            testID={testID}
            right={<Text className={cn('text-[17px] font-semibold tabular-nums', getMarketMoveClassName(change))}>{changeLabel}</Text>}
        />
    );
};
