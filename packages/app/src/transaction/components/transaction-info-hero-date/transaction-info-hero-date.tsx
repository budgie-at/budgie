import { Text, useWindowDimensions } from 'react-native';

import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TRANSACTION_INFO_STACKED_FONT_SCALE } from '../../constant/transaction-info-stacked-font-scale.constant';

interface Props {
    readonly operatedAt: Date;
}

export const TransactionInfoHeroDate = ({ operatedAt }: Props) => {
    const { fontScale } = useWindowDimensions();
    const { intl } = useI18nContext();
    const { formatWeekdayAndDateWithTime, formatDayAndMonthAndYear } = useFormatDate();
    const largeText = fontScale > TRANSACTION_INFO_STACKED_FONT_SCALE;
    const className = largeText
        ? 'mt-sm text-[15px] leading-[20px] text-secondary-foreground text-left'
        : 'mt-sm text-[15px] leading-[20px] text-secondary-foreground text-center';
    const date = largeText
        ? `${formatDayAndMonthAndYear(operatedAt)}\n${intl.formatDate(operatedAt, { hour: '2-digit', minute: '2-digit', hourCycle: 'h24' })}`
        : formatWeekdayAndDateWithTime(operatedAt);

    return <Text className={className}>{date}</Text>;
};
