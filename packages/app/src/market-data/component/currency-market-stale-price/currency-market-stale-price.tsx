import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { getMarketPriceAgeDays } from '../../utils/get-market-price-age-days.util';

interface Props {
    readonly priceDate: string;
}

export const CurrencyMarketStalePrice = ({ priceDate }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndDay } = useFormatDate();

    const ageDays = getMarketPriceAgeDays(priceDate);
    const date = formatMonthAndDay(parseISO(priceDate));
    const ageLabel = t({ message: plural(ageDays, { one: '# day old', other: '# days old' }) });

    return (
        <View className="flex-row items-center gap-x-xs">
            <Icon icon={UserIconNameEnum.Clock} size={13} className="text-secondary-foreground" />
            <Text className="text-secondary-foreground text-[13px] tabular-nums" numberOfLines={1}>
                {`${t`Price from ${date}`} · ${ageLabel}`}
            </Text>
        </View>
    );
};
