import { Trans } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import { Text } from 'react-native';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { getMarketPriceAgeDays } from '../../utils/get-market-price-age-days.util';

interface Props {
    readonly priceDate: string;
    readonly testID: string;
}

export const CurrencyMarketStatsFooter = ({ priceDate, testID }: Props) => {
    const { formatMonthAndDay } = useFormatDate();

    const ageDays = getMarketPriceAgeDays(priceDate);
    const updatedDate = formatMonthAndDay(parseISO(priceDate));

    return (
        <Text className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]" testID={testID}>
            {ageDays === 0 ? <Trans>Updated today</Trans> : null}
            {ageDays === 1 ? <Trans>Updated yesterday</Trans> : null}
            {ageDays !== 0 && ageDays !== 1 ? <Trans>Updated {updatedDate}</Trans> : null}
        </Text>
    );
};
